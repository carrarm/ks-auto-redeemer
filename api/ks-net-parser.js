import * as cheerio from "cheerio";

const KS_URL = 'https://kingshot.net/gift-codes';

/**
 * Parse the gift codes page and extract the available codes.
 *
 * @returns {Promise<string[]>}
 */
export async function parseGiftCodes() {
  const response = await fetch(KS_URL);

  if (!response.ok) {
    throw new Error(`HTTP error status: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  return $('[aria-labelledby="gift-codes-active"]').find('code').map((_, el) => $(el).text().trim()).get();
}
