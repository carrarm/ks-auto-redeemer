// Redeemer models

/**
 * @typedef {Object} ScriptOptions
 * @property {boolean} testMode - Run from the local roster file
 * @property {boolean} checkCodes - Check the available gift codes (no redemption)
 * @property {string[] | undefined} codes - Codes to redeem (if empty, codes will be retrieved from kingshot.net)
 * @property {string[] | undefined} ignoredCodes - Long-term codes that should be ignored (comma-separated)
 * @property {string[] | undefined} alliances - Alliance tags (3 letters tag)
 * @property {number} kingdomId - Kingdom ID
 */

/**
 * @typedef {Object} Player
 * @property {number} id - Kingshot ID.
 * @property {string} player - User's nickname
 */

// Mightpulse models

/**
 * @typedef {Object} AllianceRosterResponse
 * @property {RosterMember[]} members - Alliance members
 */

/**
 * @typedef {Object} RosterMember
 * @property {number} governor_id - User's governir ID (differs from the actual user's ID)
 * @property {string} nick_name - User's nickname
 * @property {number} last_active_at - Last login timestamp
 */

// kingshot.net models

/**
 * @typedef {Object} GiftCode
 * @property {string} code - Gift code
 * @property {string|null} expiresAt - Expiration date
 */

/**
 * @typedef {Object} GiftCodeResponse
 * @property {string} status - Either 'success' or 'fail'
 * @property {string} message - Message associated with the status
 * @property {{ giftCodes: GiftCode[] }} data - Response data
 */

/**
 * @typedef {Object} RedeemResponse
 * @property {string} status - Either 'success' or 'fail'
 * @property {string} message - Message associated with the status
 * @property {{ errorKey: string }} meta - Response metadata
 */

/**
 * @typedef {Object} RedeemResult
 * @property {boolean} success
 * @property {string} message - Error message, if the redemption failed
 * @property {boolean} invalid - Whether the code was invalid and should be ignored
 */