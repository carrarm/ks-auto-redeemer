class Logger {
  sectionTitle(title) {
    console.log('\n===================================================');
    console.log(`===== ${title}`);
    console.log('===================================================\n');
  }

  /**
   * @param {string}   player
   * @param {string[]} codes
   */
  redeemedCodes(player, codes) {
    const redemptionText = codes.length ? `Redeemed: ${codes.join(', ')}` : 'No code redeemed';
    console.log(`${player.padEnd(20, ' ')} - ${redemptionText}`);
  }

  /**
   * @param {string[]} usersWithRedemption
   */
  summary(usersWithRedemption) {
    this.sectionTitle('Alliance summary');
    if (usersWithRedemption.length) {
      console.log(`Users who redeemed at least 1 code: ${usersWithRedemption.map((u) => u.padEnd(20, ' ')).join(' ')}`);
    } else {
      console.log('No gift code redeemed this time.');
    }
  }
}

export const logger = new Logger();
