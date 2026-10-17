/**
 * Read command line arguments.
 *
 * @returns {ScriptOptions}
 */
export function readParams() {
  const args = process.argv.slice(2);

  const argsMap = {};
  const booleanArgs = ['--help', '--test', '--check-codes', '--firebase'];
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
    firebase: argsMap['--firebase'],
    testMode: argsMap['--test'],
    codes: argsMap['--codes']?.split(',') ?? [],
    alliances: argsMap['--alliances']?.split(',') ?? [],
    kingdomId: Number(argsMap['--kid']),
    checkCodes: argsMap['--check-codes'],
    ignoredCodes: argsMap['--ignored-codes']?.split(',') ?? [],
  }
}

/**
 * Show usage instructions.
 */
export function showUsage() {
  console.log(`Usage:
  --alliances: Alliance tags (3 letters tag, comma-separated)
  --kid: Kingdom ID
  [--firebase]: Save results in Firebase
  [--test]: Run in test mode (use local roster file and fake Firestore)
  [--codes]: Gift codes to redeem (comma-separated). If missing, codes will be retrieved from kingshot.net
  [--check-codes]: Check the available gift codes (no redemption)
  [--ignored-codes]: Long-term codes that should be ignored (comma-separated)
  [--help]: Show this help message
  `);
  process.exit(0);
}
