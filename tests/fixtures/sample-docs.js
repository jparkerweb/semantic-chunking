// -------------------------
// -- sample-docs.js --
// -------------------------------------------------------------------------------
// Representative input documents used by the characterization test suite.
// These are the canonical README "frog" / "duck" examples plus one longer
// multi-paragraph document. They are deliberately small and stable so the
// golden-output baseline is reproducible.
// -------------------------------------------------------------------------------

/**
 * The README "frog" example text.
 * @type {string}
 */
export const frogText = "A frog hops into a deli and croaks to the cashier, \"I'll have a sandwich, please.\" The cashier, surprised, quickly makes the sandwich and hands it over. The frog takes a big bite, looks around, and then asks, \"Do you have any flies to go with this?\" The cashier, taken aback, replies, \"Sorry, we're all out of flies today.\" The frog shrugs and continues munching on its sandwich, clearly unfazed by the lack of fly toppings. Just another day in the life of a sandwich-loving amphibian! 🐸🥪";

/**
 * The README "duck" example text.
 * @type {string}
 */
export const duckText = "A duck waddles into a bakery and quacks to the baker, \"I'll have a loaf of bread, please.\" The baker, amused, quickly wraps the loaf and hands it over. The duck takes a nibble, looks around, and then asks, \"Do you have any seeds to go with this?\" The baker, chuckling, replies, \"Sorry, we're all out of seeds today.\" The duck nods and continues nibbling on its bread, clearly unfazed by the lack of seed toppings. Just another day in the life of a bread-loving waterfowl! 🦆🍞";

/**
 * A longer multi-paragraph document spanning several distinct topics so the
 * similarity-driven chunking and multi-pass merge paths are exercised.
 * @type {string}
 */
export const multiParagraphText = `The water cycle describes the continuous movement of water on, above, and below the surface of the Earth. Water evaporates from oceans and lakes, rising into the atmosphere as vapor. As the vapor cools, it condenses into clouds. Eventually the water returns to the surface as precipitation such as rain or snow.

Photosynthesis is the process by which green plants convert sunlight into chemical energy. Chlorophyll in the leaves absorbs light, which drives the conversion of carbon dioxide and water into glucose. Oxygen is released as a byproduct of this reaction. Without photosynthesis, most life on Earth could not exist.

The history of computing stretches back thousands of years. Early mechanical devices like the abacus helped people perform arithmetic. In the twentieth century, electronic computers transformed science and industry. Today, computers fit in our pockets and connect billions of people across the globe.

Coffee is one of the most widely consumed beverages in the world. The beans are harvested from coffee plants, then roasted to develop their flavor. Brewing methods range from simple drip machines to elaborate espresso rituals. For many people, a morning cup of coffee is an essential part of the daily routine.`;

/**
 * Array of document objects (the {@link chunkit}/{@link cramit}/{@link sentenceit}
 * input shape) keyed by a stable fixture name. The `name` is used to derive
 * golden-fixture filenames so it must remain stable across runs.
 * @type {Array<{name: string, document_name: string, document_text: string}>}
 */
export const sampleDocs = [
    {
        name: 'frog',
        document_name: 'frog document',
        document_text: frogText,
    },
    {
        name: 'duck',
        document_name: 'duck document',
        document_text: duckText,
    },
    {
        name: 'multiparagraph',
        document_name: 'multi-paragraph document',
        document_text: multiParagraphText,
    },
];
