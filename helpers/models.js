// Redeemer models

/**
 * @typedef {Object} ScriptOptions
 * @property {boolean} firebase - Store results in Firebase
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
 * @property {number} allianceId - Alliance ID
 * @property {string} allianceTag - Alliance tag (3 letters)
 */

/**
 * @typedef {Object} Alliance
 * @property {number} id - Kingshot ID.
 * @property {string} tag - 3 letters alliance tag
 */

// Mightpulse models

/**
 * @typedef {Object} AllianceRosterResponse
 * @property {number} aid - Alliance ID
 * @property {RosterMember[]} members - Alliance members
 * @property {string} error - Response error, if any
 */

/**
 * @typedef {Object} RosterMember
 * @property {number} governor_id - User's governor ID (differs from the actual user's ID)
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
 * @property {string} errorCode - Error code, if the redemption failed
 * @property {boolean} invalid - Whether the code was invalid and should be ignored
 */

// Firebase models

/**
 * @typedef {Object} CodeFailure
 * @property {string} giftCode - Gift code
 * @property {string} errorCode - Technical error code
 * @property {string} message - Error message
 * @property {number} failureCount - Number of times this code has been tried and failed
 */

/**
 * @typedef {Object} FirebaseUserDocument
 * @property {number} governorId - Governor ID
 * @property {number} username - Governor name
 * @property {Alliance} alliance - Governor alliance
 * @property {string[]} redeemed - All codes successfully redeemed
 * @property {string[]} allCodes - All attempted redemptions
 * @property {string[]} ignoredCodes - Codes that have been failed too many times and should be skipped for this user
 * @property {CodeFailure[]} failures - Codes that failed redemption
 * @property {string} lastExec - Last execution date
 */

/**
 * @typedef {Object} SummaryDocument
 * @property {Alliance} alliance - Alliance
 * @property {string} execTime - Duration in minutes
 * @property {number} totalRedeemed - Number of codes redeemed
 * @property {string[]} usersWithErrors - Users who had redemption errors
 * @property {string} lastExec - Last execution date
 */
