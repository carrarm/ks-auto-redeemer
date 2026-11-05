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

  /** @type {Partial<SummaryDocument>} */
  const mergedSummary = { totalRedeemed: 0, usersWithErrors: [], execTime: 0 };
  for (const [allianceTag, summary] of Object.entries(report)) {
    mergedSummary.totalRedeemed += summary.totalRedeemed;
    mergedSummary.usersWithErrors = mergedSummary.usersWithErrors.concat(summary.usersWithErrors.map((u) => `[${allianceTag}] ${u}`));
    mergedSummary.execTime += summary.execTime;
  }

  try {
    await transporter.sendMail({
      from: `"ks-auto-redeemer" <${process.env.SMTP_AUTH_USER}>`,
      to: process.env.MAIL_TO,
      subject: `Redemption report - ${codes.length} codes - ${mergedSummary.totalRedeemed} redeemed/${mergedSummary.usersWithErrors.length} failed`,
      html: `
<u>
  <li>Codes: ${codes.join(', ')}</li>
  <li>Total redeemed: ${mergedSummary.totalRedeemed}</li>
  <li>Failed redemptions: ${mergedSummary.usersWithErrors.length} (see below if any)</li> 
  <li>Total execution time: ${mergedSummary.execTime} minutes</li>      
</u>

<p>
${mergedSummary.usersWithErrors.join('<br>')}
</p>
`,
    });
  } catch (error) {
    console.error('Failed to send the email', error);
  }
}
