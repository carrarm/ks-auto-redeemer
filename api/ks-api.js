const mightpulseApiKey = process.env.MIGHTPULSE_API_KEY;
const mightpulseBaseApi = 'https://api.mightpulse.com/v1';

const mightpulseHeaders = {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${mightpulseApiKey}`,
    'Content-Type': 'application/json'
  }
}

const INVALID_ERROR_CODES = ['GIFT_CODE_EXPIRED', 'GIFT_CODE_MAX_USE_REACHED'];

/**
 * Get the currently available gift codes.
 * Gift codes are retrieved from kingshot.net.
 *
 * @returns {Promise<string[]>} Valid gift codes
 */
export async function getGiftCodes() {
  /** @type {GiftCodeResponse} */
  const httpResponse = await fetch('https://kingshot.net/api/gift-codes').then((resp) => resp.json());

  if (httpResponse.status === 'success') {
    return httpResponse.data.giftCodes.map(({ code }) => code);
  } else {
    console.error('Unable to retrieve gift codes: ', httpResponse.message);
    return [];
  }
}

/**
 * Get the alliance roster for a given alliance tag.
 *
 * @param {number} kingdomId - Kingdom ID
 * @param {string} allianceTag - 3 letters alliance tag
 * @returns {Promise<Player[]>} Alliance members
 */
export async function getAllianceMembers(kingdomId, allianceTag) {
  const endpoint = `${mightpulseBaseApi}/alliances/${kingdomId}/${allianceTag}?include=roster`;

  /** @type {AllianceRosterResponse} */
  const apiResponse = await fetch(endpoint, mightpulseHeaders).then((resp) => resp.json());

  if (apiResponse.error) {
    console.error('Unable to retrieve alliance roster: ', apiResponse.error);
    return [];
  }

  return apiResponse.members
    // Dates are wrong
    // .filter((user) => recentlyLoggedIn(user.last_active_at))
    .map((user) => ({ player: user.nick_name, id: user.governor_id, allianceId: apiResponse.aid, allianceTag }));
}

/**
 * Redeem a gift code for a given player.
 *
 * @param {string} code - Gift code
 * @param {number} playerId - Governor ID
 * @returns {Promise<RedeemResult>} Redemption result
 */
export async function redeemGiftCode(code, playerId) {
  const payload = { giftCode: code, playerId: `${playerId}` };

  /** @type {RedeemResult} */
  const result = { success: false, message: '', invalid: false, errorCode: '' };

  try {
    /** @type {RedeemResponse} */
    const redeemResponse = await fetch('https://kingshot.net/api/gift-codes/redeem', {
      method: 'POST',
      body: JSON.stringify(payload)
    }).then((resp) => resp.json());

    result.success = redeemResponse.status === 'success';
    result.invalid = INVALID_ERROR_CODES.includes(redeemResponse.meta?.errorKey);

    if (!result.success) {
      result.errorCode = redeemResponse.meta?.errorKey ?? 'unknown';
      result.message = redeemResponse.message;
    }
  } catch (e) {
    console.error('Unexpected error while redeeming code', e);
  }

  return result;
}


// Helpers

/**
 * Check if the member logged in recently.
 *
 * @param {number} lastLogin - Last login timestamp
 */
function recentlyLoggedIn(lastLogin) {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  return new Date(lastLogin) > lastWeek;
}
