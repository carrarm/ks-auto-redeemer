const allianceMembers = {
  'Lady Chuck VI': 395645558,
  'Lord Chuck IV': 378498164,
  'Sassu': 379104714,
  'Divayth': 379333991,
  'Kangaroo': 378941129,
};

let totalUsersRedeemed = 0;

fetch('https://kingshot.net/api/gift-codes')
  .then((resp) => resp.json())
  .then(async (httpResponse) => {
    if (httpResponse.status === 'success') {
      let giftCodes = httpResponse.data.giftCodes.map(({ code }) => code);
      console.log('Codes:', giftCodes);

      for (const [player, id] of Object.entries(allianceMembers)) {
        const { redeemed, invalid } = await redeemCodes(giftCodes, player, id);
        giftCodes = filterCodes(giftCodes, invalid);
        totalUsersRedeemed += redeemed.length;
      }

      console.log('===================================================');

      if (totalUsersRedeemed) {
        console.log(`${totalUsersRedeemed} user(s) received at least 1 gift code`);
      } else {
        console.log('No gift code redeemed this time.');
      }
    } else {
      console.error('Unable to retrieve gift codes: ', httpResponse.message)
    }
});

async function redeemCodes(codes, player, id) {
  console.log('===================================================');
  const errors = [];
  const success = [];
  const invalidCodes = [];
  for (const code of codes) {
    const payload = { giftCode: code, playerId: `${id}` };
    try {
      const redeemResponse = await fetch('https://kingshot.net/api/gift-codes/redeem', { method: 'POST', body: JSON.stringify(payload) }).then((resp) => resp.json());
      if (redeemResponse.status === 'fail') {
        errors.push({ code, message: redeemResponse.message })
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

  const messages = [`Redeeming codes for ${player} [${id}]`, `Redeemed with success: ${success.join(', ') || 'None'}`];
  if (errors.length) {
    messages.push('Failures:');
    errors.forEach((error) => messages.push(`- ${error.code}: ${error.message}`))
  }
  console.log(messages.join('\n'));

  if (invalidCodes.length) {
    console.log(`\nThese codes were invalid (expired, max redeem reached, ...) and will be ignore for the remaining users: ${invalidCodes.join(', ')}\n`)
  }

  return { redeemed: success, invalid: invalidCodes };
}

function filterCodes(allCodes, invalidCodes) {
  return allCodes.filter((code) => !invalidCodes.includes(code));
}
