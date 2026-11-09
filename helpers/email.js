import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ?? 465,
  secure: true,
  auth: {
    user: process.env.SMTP_AUTH_USER,
    pass: process.env.SMTP_AUTH_PASSWORD,
  },
});

/**
 * Send an email with the redemption report.
 *
 * @param {string[]} codes - Codes that were attempted
 * @param {Record<string, SummaryDocument>} report - Redemption report per alliance
 */
export async function sendReport(codes, report) {
  console.log(`Sending report email to ${process.env.MAIL_TO}...`);

  const usersWithErrors = [];

  /** @type {Partial<SummaryDocument>} */
  const mergedSummary = { totalRedeemed: 0, usersWithErrors: {}, execTime: 0 };
  for (const [allianceTag, summary] of Object.entries(report)) {
    mergedSummary.totalRedeemed += summary.totalRedeemed;
    for(const [username, errors] of Object.entries(summary.usersWithErrors)) {
      usersWithErrors.push(`[${allianceTag}] ${username}: ${errors.join(', ')}`);
    }
    mergedSummary.execTime += summary.execTime;
  }

  let errorList = '';
  if (usersWithErrors.length) {
    errorList = `
    <p>Redemption errors:</p>
    <ul>
      ${usersWithErrors.map((error) => `<li>${error}</li>`).join('')}}
  </ul>
  `
  }

  try {
    await transporter.sendMail({
      from: `"ks-auto-redeemer" <${process.env.SMTP_AUTH_USER}>`,
      to: process.env.MAIL_TO,
      subject: `Redemption report - ${codes.length} codes - ${mergedSummary.totalRedeemed} redeemed/${usersWithErrors.length} failed`,
      html: `
<ul>
  <li>Codes: ${codes.join(', ')}</li>
  <li>Total redeemed: ${mergedSummary.totalRedeemed}</li>
  <li>Failed redemptions: ${usersWithErrors.length} (see below if any)</li> 
  <li>Total execution time: ${mergedSummary.execTime} minutes</li>      
</ul>

${errorList}
`,
    });
  } catch (error) {
    console.error('Failed to send the email', error);
  }
}
