import { cert, initializeApp } from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from './service-account-key.json' with { type: 'json' };

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

/**
 * Store the result of a redemption attempt.
 * @param {Player} player - Player
 * @param {string[]} allCodes - All redeemable codes attempted
 * @param {string[]} redeemed - Redeemed codes
 * @param {string[]} ignored - Ignored codes
 * @param {CodeFailure[]} failures - Failed redemptions
 */
export async function storePlayerResult(player, allCodes, redeemed, ignored, failures) {
  const redeemedCodes = [...redeemed];

  for (const failure of failures) {
    if (['GIFT_CODE_ALREADY_REDEEMED', 'GIFT_CODE_CRITERIA_NOT_MET'].includes(failure.errorCode)) {
      // Mark these codes as redeemed so that they won't be tried again - they will fail every time
      redeemedCodes.push(failure.giftCode);
    }
  }

  /** @type {FirebaseUserDocument} */
  const result = {
    governorId: player.id,
    username: player.player,
    alliance: { id: player.allianceId, tag: player.allianceTag },
    redeemed: redeemedCodes,
    attempted: allCodes,
    ignoredCodes: ignored,
    failures,
    lastExec: new Date().toISOString(),
  };

  try {
    const docRef = db.collection('users').doc(`${player.id}`);
    await docRef.set(result);

    const doc = await docRef.get();
    if (!doc.exists) {
      console.log(`Error saving the document for ${player.player}`);
    }
  } catch (e) {
    console.error(`Error creating or getting the document for ${player.player}`, e);
  }
}

/**
 * Get the player's last redemption result.
 * @param {number} governorId - Governor ID
 * @returns {Promise<FirebaseUserDocument | undefined>} Last redemption result, if any
 */
export function getPlayerResult(governorId) {
  return db.collection('users').doc(`${governorId}`).get().then((doc) => doc.exists ? doc.data() : undefined);
}

/**
 * Store the result of a redemption attempt.
 * @param {SummaryDocument} summary - Alliance summary
 */
export async function storeSummary(summary) {
  try {
    const docRef = db.collection('summaries').doc(summary.alliance.tag);
    await docRef.set(summary);
  } catch (e) {
    console.error(`Error creating or getting the summary for ${summary.alliance.tag}`, e);
  }
}

/**
 * Display the summary of a redemption attempt.
 *
 * @param {string} tag - Alliance tag
 */
export async function displaySummary(tag) {
  const doc = await db.collection('summaries').doc(tag).get();
  if (!doc.exists) {
    console.log(`No summary found for alliance ${tag}`);
    return;
  }

  /** @type {SummaryDocument} */
  const summary = doc.data();

  console.log('\n===================================================');
  console.log(`===== Redemption summary for ${summary.alliance.tag}`);
  console.log('===================================================\n');

  console.log('Execution date: ', summary.lastExec);
  console.log(`Execution time: ${summary.execTime} minutes`);
  console.log(`${summary.totalRedeemed} code(s) redeemed`);
  if (summary.usersWithErrors) {
    console.log('These users failed to redeem one or more codes:');
    const users = summary.usersWithErrors.map((user) => user.padEnd(25, ' '));
    console.log(users.join(' '));
  }
}

/**
 * Store the list of invalid codes that should be ignored.
 * @param {string[]} codes - Invalid codes
 */
export function storeInvalidCodes(codes) {
  const docRef = db.collection('codes').doc('invalid');
  return docRef.set({ codes });
}

/**
 * Get the list of invalid codes that should be ignored.
 * @param {string[]} currentCodes - Today's active codes
 * @returns {Promise<string[]>}
 */
export async function getInvalidCodes(currentCodes) {
  const doc = await db.collection('codes').doc('invalid').get();
  const invalidCodes = doc.exists ? doc.data().codes : [];
  return invalidCodes.filter((code) => currentCodes.includes(code));
}
