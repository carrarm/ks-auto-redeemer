import { getAllianceMembers, getGiftCodes, redeemGiftCode } from "./api/ks-api.js";
import { parseGiftCodes } from "./api/ks-net-parser.js";
import {
  displaySummary,
  getInvalidCodes,
  getPlayerResult,
  storeInvalidCodes,
  storePlayerResult,
  storeSummary
} from "./firebase/firebase-storage.js";
import { readParams, showUsage } from "./helpers/script-options.js";
import allianceRoster from './ks-alliance-roster.json' with { type: 'json' };

/**
 * Redeem gift codes for all members of an alliance.
 *
 * @param {number} kingdomId - Kingdom ID
 * @param {string} allianceTag - Alliance tag
 * @param {string[]} giftCodes - Codes to redeem
 * @param {Player[]} roster - Alliance roster (optional - for test purposes)
 * @param {boolean} withStorage - Store script results
 */
async function redeemCodesForAlliance(kingdomId, allianceTag, giftCodes, roster, withStorage = false) {
  console.log('\n===================================================');
  console.log(`===== Alliance ${allianceTag}`);
  console.log('===================================================\n');

  const startTime = Date.now();

  console.log('Loading alliance members...');

  const allianceMembers = roster || await getAllianceMembers(kingdomId, allianceTag);

  if (!allianceMembers.length) {
    console.log('No members found for this alliance');
    return;
  }

  console.log(`${allianceMembers.length} members found for alliance ${allianceTag} [Kingdom ${kingdomId}]\n`);
  console.log('Redeeming codes...');

  let totalRedeemedCodes = 0;
  const usersWithErrors = [];
  let invalidCodes = await getInvalidCodes(giftCodes);

  let progress = 1;

  for (const member of allianceMembers) {
    giftCodes = filterCodes(giftCodes, invalidCodes);

    const { redeemed, invalid, errors } = await redeemCodes(giftCodes, member, withStorage);

    let redemptionText = redeemed.length ? `Redeemed: ${redeemed.join(', ')}` : 'No code redeemed';
    if (errors.length) {
      usersWithErrors.push(member.player);
      redemptionText += ` | ${errors.length} failed redemption(s)`;
      if (!withStorage) {
        redemptionText += `: ${errors.join(', ')}}`;
      }
    }
    const progressText = `(${progress}/${allianceMembers.length})`.padEnd(9, ' ');
    console.log(`${progressText} ${member.player.padEnd(20, ' ')} - ${redemptionText}`);

    totalRedeemedCodes += redeemed.length;

    if (invalid.length) {
      invalidCodes = invalidCodes.concat(invalid);
      console.log(`These codes were invalid (expired, max redeem reached, ...) and will be ignored for the remaining users: ${invalid.join(', ')}`)
    }

    progress++;
  }

  const totalTimeMs = Date.now() - startTime;

  await storeInvalidCodes(invalidCodes);

  /** @type {SummaryDocument} */
  const summary = {
    alliance: { tag: allianceTag, id: allianceMembers[0].allianceId },
    totalRedeemed: totalRedeemedCodes,
    usersWithErrors,
    lastExec: new Date().toISOString(),
    execTime: Math.round(totalTimeMs / 1000 / 60),
  };
  await storeSummary(summary);
}

async function run() {

  const params = readParams();

  console.log('\n===================================================');
  console.log(`===== Gift codes`);
  console.log('===================================================\n');

  let giftCodes = params.codes.length ? params.codes : await loadGiftCodes();
  if (params.ignoredCodes.length) {
    console.log(`Ignoring codes: ${params.ignoredCodes.join(', ')}`);
    giftCodes = filterCodes(giftCodes, params.ignoredCodes);
  }
  if (giftCodes.length) {
    console.log(`Gift codes: ${giftCodes.join(', ')}\n`);
  } else {
    console.log('No code to redeem');
    process.exit(0);
  }

  if (params.checkCodes) {
    process.exit(0);
  }

  /** @type {Player[] | undefined} */
  let players = undefined;
  if (params.testMode) {
    console.log('Running in test mode');
    players = allianceRoster.members.map((user) => ({ player: user.nick_name, id: user.governor_id }));
  }

  const allianceTags = params.alliances;
  if (!allianceTags.length) {
    console.log('No alliances specified. Exiting.');
    showUsage();
  }

  const kingdomId = params.kingdomId;
  if (Number.isNaN(kingdomId)) {
    console.log('Invalid kingdom ID. Exiting.');
    showUsage();
  }

  for (const tag of allianceTags) {
    await redeemCodesForAlliance(kingdomId, tag, giftCodes, players, params.firebase);
  }

  for (const tag of allianceTags) {
    await displaySummary(tag);
  }
}

run();

// INTERNAL FUNCTIONS

/**
 * Redeem all gift codes for a given player.
 *
 * @param {string[]} codes - Gift codes to redeem
 * @param {Player} player - Player
 * @param {boolean} withStorage - Store script results
 * @returns {Promise<{redeemed: string[], invalid: string[], errors: string[] }>}
 */
async function redeemCodes(codes, player, withStorage = false) {
  const redeemedCodes = [];
  const invalidCodes = [];

  /** @type {CodeFailure[]} */
  const failures = [];

  const lastAttempt = withStorage ? await getPlayerResult(player.id) : undefined;
  if (lastAttempt?.redeemed.length) {
    redeemedCodes.push(...lastAttempt.redeemed);
  }
  const codesToRedeem = filterCodes(codes, redeemedCodes);

  for (const code of codesToRedeem) {
    let retryAttempts = 0;
    do {
      const redemptionResult = await redeemGiftCode(code, player.id);
      if (redemptionResult.success) {
        redeemedCodes.push(code);
      }

      if (redemptionResult.invalid) {
        invalidCodes.push(code);
      } else if (redemptionResult.errorCode) {
        if (redemptionResult.message?.includes('Too many redemption attempts')) {
          console.log(`[${player.player}] Too many redemption attempts while redeeming ${code}. ${retryAttempts ? '' : 'Retrying once in 2m...'}`);
          retryAttempts++;
          await sleep(120000);
        } else {
          failures.push({ giftCode: code, errorCode: redemptionResult.errorCode, message: redemptionResult.message });
        }
      }


      await sleep(5000);
    } while (retryAttempts && retryAttempts < 2);
  }

  if (withStorage) {
    await storePlayerResult(player, codesToRedeem, redeemedCodes, failures);
  }

  const redeemedToday = lastAttempt?.redeemed ? redeemedCodes.filter((code) => !lastAttempt.redeemed.includes(code)) : redeemedCodes;
  const errorMessages = failures.map(({ giftCode, errorCode, message }) => `[${giftCode} - ${errorCode}: ${message}]`);
  return { redeemed: redeemedToday, invalid: invalidCodes, errors: errorMessages };
}

function filterCodes(allCodes, ignoredCodes) {
  return allCodes.filter((code) => !ignoredCodes.includes(code));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadGiftCodes() {
  try {
    const ksParsedCodes = await parseGiftCodes();
    console.log('Loaded gift codes from kingshot.net');
    return ksParsedCodes;
  } catch (e) {
    console.error('Error parsing gift codes from kingshot.net', e);
  }

  const apiGiftCodes = await getGiftCodes();
  console.log('Loaded gift codes from kingshot API');

  return apiGiftCodes;
}
