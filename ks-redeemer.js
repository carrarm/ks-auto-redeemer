// const allianceRoster = require('./ks-alliance-roster.json');

const mightpulseApiKey = process.argv[2];
const mightpulseBaseApi = 'https://api.mightpulse.com/v1';

const kingdomId = 2363;

const allianceTags = ['FRA', 'emr'];

const headers = {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${mightpulseApiKey}`,
    'Content-Type': 'application/json'
  }
}

async function redeemCodesForAlliance(allianceTag) {
  let giftCodes = await getGiftCodes();
  if (!giftCodes.length) {
    console.log('No code to redeem');
    return;
  }

  const allianceMembers = await getAllianceMembers(allianceTag);

  console.log(`${allianceMembers.length} members found for alliance ${allianceTag} [Kingdom ${kingdomId}]\n`);

  const usersWithRedeem = [];

  console.log(`Gift codes: ${giftCodes.join(', ')}\n`);

  for (const { player, id } of allianceMembers) {
    const { redeemed, invalid } = await redeemCodes(giftCodes, player, id);
    giftCodes = filterCodes(giftCodes, invalid);
    if (redeemed.length) {
      usersWithRedeem.push(player);
    }

    await sleep(2000);
  }

  console.log('\n===================================================\n');

  if (usersWithRedeem.length) {
    console.log(`Users who redeemed at least 1 code: ${usersWithRedeem.join(', ')}`);
  } else {
    console.log('No gift code redeemed this time.');
  }
}

async function run() {
  for (const tag of allianceTags) {
    await redeemCodesForAlliance(tag);

    console.log('\n===================================================\n\n');
    console.log('\n===================================================\n');
  }
}

run();

// INTERNAL FUNCTIONS

async function getAllianceMembers(allianceTag) {
  // return allianceRoster.members.map((user) => ({ player: user.nick_name, id: user.governor_id }));
  const endpoint = `${mightpulseBaseApi}/alliances/${kingdomId}/${allianceTag}?include=roster`;
  const apiResponse = await fetch(endpoint, headers).then((resp) => resp.json());
  return apiResponse.members.map((user) => ({ player: user.nick_name, id: user.governor_id }));
}

async function getGiftCodes() {
  const httpResponse = await fetch('https://kingshot.net/api/gift-codes').then((resp) => resp.json());
  if (httpResponse.status === 'success') {
    return httpResponse.data.giftCodes.map(({ code }) => code);
  } else {
    console.error('Unable to retrieve gift codes: ', httpResponse.message);
    return [];
  }
}

async function redeemCodes(codes, player, id) {
  console.log('===================================================');
  const errors = [];
  const success = [];
  const invalidCodes = [];
  const ignoredErrorCodes = ['GIFT_CODE_ALREADY_REDEEMED', 'GIFT_CODE_MAX_USE_REACHED'];
  for (const code of codes) {
    const payload = { giftCode: code, playerId: `${id}` };
    try {
      const redeemResponse = await fetch('https://kingshot.net/api/gift-codes/redeem', { method: 'POST', body: JSON.stringify(payload) }).then((resp) => resp.json());
      if (redeemResponse.status === 'fail') {
        if (!ignoredErrorCodes.includes(redeemResponse.meta.errorKey)) {
          errors.push({ code, message: redeemResponse.message })
        }
        if (redeemResponse.meta.errorKey === 'GIFT_CODE_MAX_USE_REACHED') {
          invalidCodes.push(code);
        }
      } else if (redeemResponse.status === 'success') {
        success.push(code);
      }
    } catch (e) {
      console.error('Unexpected error while redeeming code', e);
    }
  }

  const messages = [`Redeeming codes for ${player} [${id}]`, `Codes redeemed: ${success.join(', ') || 'None'}`];
  if (errors.length) {
    messages.push('Failures:');
    errors.forEach((error) => messages.push(`- ${error.code}: ${error.message}`))
  }
  console.log(messages.join('\n'));

  if (invalidCodes.length) {
    console.log(`\nThese codes were invalid (expired, max redeem reached, ...) and will be ignored for the remaining users: ${invalidCodes.join(', ')}\n`)
  }

  return { redeemed: success, invalid: invalidCodes };
}

function filterCodes(allCodes, invalidCodes) {
  return allCodes.filter((code) => !invalidCodes.includes(code));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
