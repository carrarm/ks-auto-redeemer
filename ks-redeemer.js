import { getAllianceMembers, getGiftCodes, redeemGiftCode } from "./ks-api.js";
import { logger } from "./logger.js";
import allianceRoster from './ks-alliance-roster.json' with { type: "json" };

const ROSTER = allianceRoster;

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

  const allianceMembers = roster || await getAllianceMembers(kingdomId, allianceTag);

  if (!allianceMembers.length) {
    console.log('No members found for this alliance');
    return;
  }

  console.log(`${allianceMembers.length} members found for alliance ${allianceTag} [Kingdom ${kingdomId}]\n`);

  const usersWithRedemption = [];

  for (const { player, id } of allianceMembers) {
    const { redeemed, invalid, errors } = await redeemCodes(giftCodes, player, id);
    logger.redeemedCodes(player, redeemed);

    if (invalid.length) {
      console.log(`These codes were invalid (expired, max redeem reached, ...) and will be ignored for the remaining users: ${invalid.join(', ')}`)
    }
    if (errors.length) {
      console.log(`Redemption errors: ${errors.join(', ')}`)
    }
    if (redeemed.length) {
      usersWithRedemption.push(player);
    }

    giftCodes = filterCodes(giftCodes, invalid);

    await sleep(2000);
  }

  logger.summary(usersWithRedemption);
}

async function run() {

  let allianceRoster = [];

  const params = readParams();

  let giftCodes = params.codes || await getGiftCodes();
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
    players = ROSTER.members.map((user) => ({ player: user.nick_name, id: user.governor_id }));
  }

  const allianceTags = params.alliances;
  if (!allianceTags) {
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
  const success = [];
  const invalidCodes = [];

  for (const code of codes) {
    const redemptionResult = await redeemGiftCode(code, id);
    if (redemptionResult.success) {
      success.push(code);
    }

    if (redemptionResult.invalid) {
      invalidCodes.push(code);
    }

    if (redemptionResult.message) {
      errors.push(`[code=${code}, message=${redemptionResult.message}]`)
    }

    await sleep(1000);
  }

  return { redeemed: success, invalid: invalidCodes, errors };
}

function filterCodes(allCodes, invalidCodes) {
  return allCodes.filter((code) => !invalidCodes.includes(code));
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
    argsMap[key] = value;
    if (booleanArgs.includes(key)) {
      argsMap[key] = true;
    }
  });

  if (argsMap['--help']) {
    usage();
  }

  return {
    testMode: argsMap['--test'],
    codes: argsMap['--codes']?.split(','),
    alliances: argsMap['--alliances']?.split(','),
    kingdomId: Number(argsMap['--kid']),
    checkCodes: argsMap['--check-codes'],
  }
}

function usage() {
  console.log(`Usage:
  --alliances: Alliance tags (3 letters tag, comma-separated)
  --kid: Kingdom ID
  [--test]: Run in test mode (use local roster file)
  [--codes]: Gift codes to redeem (comma-separated). If missing, codes will be retrieved from kingshot.net
  [--check-codes]: Check the available gift codes (no redemption)
  [--help]: Show this help message
  `);
  process.exit(0);
}