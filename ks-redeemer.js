import allianceRoster from './ks-alliance-roster.json' with { type: 'json' };
import { getAllianceMembers, getGiftCodes, redeemGiftCode } from "./ks-api.js";
import { parseGiftCodes } from "./ks-net-parser.js";
import { logger } from "./logger.js";

/**
 * Redeem gift codes for all members of an alliance.
 *
 * @param {number} kingdomId - Kingdom ID
 * @param {string} allianceTag - 3 letters alliance tag
 * @param {string[]} giftCodes - Codes to redeem
 * @param {Player[]} roster - Alliance roster (optional - for test purposes)
 */
async function redeemCodesForAlliance(kingdomId, allianceTag, giftCodes, roster) {
  logger.sectionTitle(`Alliance ${allianceTag}`);

  console.log('Loading alliance members...');

  const allianceMembers = roster || await getAllianceMembers(kingdomId, allianceTag);

  if (!allianceMembers.length) {
    console.log('No members found for this alliance');
    return;
  }

  console.log(`${allianceMembers.length} members found for alliance ${allianceTag} [Kingdom ${kingdomId}]\n`);
  console.log('Redeeming codes...');

  const usersWithRedemption = [];

  for (const { player, id } of allianceMembers) {
    const { redeemed, invalid, errors } = await redeemCodes(giftCodes, player, id);
    logger.redeemedCodes(player, redeemed);

    if (invalid.length) {
      console.log(`These codes were invalid (expired, max redeem reached, ...) and will be ignored for the remaining users: ${invalid.join(', ')}`)
    }
    if (errors.length) {
      console.log(`Redemption errors: ${errors.join(', ')}`);
    }
    if (redeemed.length) {
      usersWithRedemption.push(player);
    }

    giftCodes = filterCodes(giftCodes, invalid);
  }

  logger.summary(usersWithRedemption);
}

async function run() {

  const params = readParams();

  logger.sectionTitle('Gift codes');
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
    usage();
  }

  const kingdomId = params.kingdomId;
  if (Number.isNaN(kingdomId)) {
    console.log('Invalid kingdom ID. Exiting.');
    usage();
  }

  for (const tag of allianceTags) {
    await redeemCodesForAlliance(kingdomId, tag, giftCodes, players);
  }
}

run();

// INTERNAL FUNCTIONS


/**
 * Redeem all gift codes for a given player.
 *
 * @param {string[]} codes - Gift codes to redeem
 * @param {string} player - Player's nickname
 * @param {number} id - Player's ID (governor ID)
 * @returns {Promise<{redeemed: string[], invalid: string[], errors: string[] }>}
 */
async function redeemCodes(codes, player, id) {
  const errors = [];
  const redeemedCodes = [];
  const invalidCodes = [];

  for (const code of codes) {
    let retryAttempts = 0;
    do {
      const redemptionResult = await redeemGiftCode(code, id);
      if (redemptionResult.success) {
        redeemedCodes.push(code);
      }

      if (redemptionResult.invalid) {
        invalidCodes.push(code);
      }

      if (redemptionResult.message) {
        if (redemptionResult.message.includes('Too many redemption attempts')) {
          console.log(`[${player}] Too many redemption attempts while redeeming ${code}. ${retryAttempts ? '' : 'Retrying once in 2m...'}`);
          retryAttempts++;
          await sleep(120000);
        } else {
          errors.push(`[code=${code}, message=${redemptionResult.message}]`)
        }
      }

      await sleep(5000);
    } while (retryAttempts && retryAttempts < 2);
  }

  return { redeemed: redeemedCodes, invalid: invalidCodes, errors };
}

function filterCodes(allCodes, ignoredCodes) {
  return allCodes.filter((code) => !ignoredCodes.includes(code));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Read command line arguments.
 *
 * @returns {ScriptOptions}
 */
function readParams() {
  const args = process.argv.slice(2);

  const argsMap = {};
  const booleanArgs = ['--help', '--test', '--check-codes'];
  args.forEach(arg => {
    const [key, value] = arg.split('=');
    if (typeof value === 'string') {
      argsMap[key] = value.trim() || undefined;
    } else {
      argsMap[key] = value;
    }
    if (booleanArgs.includes(key)) {
      argsMap[key] = true;
    }
  });

  if (argsMap['--help']) {
    usage();
  }

  return {
    testMode: argsMap['--test'],
    codes: argsMap['--codes']?.split(',') ?? [],
    alliances: argsMap['--alliances']?.split(',') ?? [],
    kingdomId: Number(argsMap['--kid']),
    checkCodes: argsMap['--check-codes'],
    ignoredCodes: argsMap['--ignored-codes']?.split(',') ?? [],
  }
}

function usage() {
  console.log(`Usage:
  --alliances: Alliance tags (3 letters tag, comma-separated)
  --kid: Kingdom ID
  [--test]: Run in test mode (use local roster file)
  [--codes]: Gift codes to redeem (comma-separated). If missing, codes will be retrieved from kingshot.net
  [--check-codes]: Check the available gift codes (no redemption)
  [--ignored-codes]: Long-term codes that should be ignored (comma-separated)
  [--help]: Show this help message
  `);
  process.exit(0);
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
