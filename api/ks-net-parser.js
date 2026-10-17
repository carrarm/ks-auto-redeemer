import * as cheerio from "cheerio";

const KS_URL = 'https://kingshot.net/gift-codes';

/**
 * Parse the gift codes page and extract the available codes.
 *
 * @returns {Promise<string[]>}
 */
export async function parseGiftCodes() {

  //  Structure:

//   <div class="space-y-4">
//     <div class="flex items-center gap-2">
//         ...
//         <h2 class="text-2xl font-bold">Active Gift Codes</h2>
//     </div>
//     <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
//         <div data-slot="card" data-size="default" >
//             <div class="absolute right-2 top-2"><span data-slot="badge" data-variant="default" >Active</span></div>
//             <div data-slot="card-header">
//                 <div class="space-y-2">
//                     <div class="flex items-center justify-center">
//                         <div class="rounded-lg bg-muted px-4 py-2">
//                             <p class="font-mono text-xl font-bold tracking-wider">Kingshot888</p>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//         <div data-slot="card-content" class="px-4 group-data-[size=sm]/card:px-3 space-y-3">
//             ...
//         </div>
//     </div>
// </div>

  const response = await fetch(KS_URL);

  if (!response.ok) {
    throw new Error(`HTTP error status: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  return $("h2")
    .filter((_, el) => $(el).text().trim() === "Active Gift Codes")
    .parent()
    .next()
    .find('[data-slot="card-header"] p.font-mono')
    .map((_, el) => $(el).text().trim())
    .get();
}
