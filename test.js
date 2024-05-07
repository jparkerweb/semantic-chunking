import { chunkit } from './chunkit.js';

let frogText = `Once upon a time in a bustling city filled with towering skyscrapers and busy streets, there lived a peculiar little frog named Frankie. Unlike his relatives who preferred the quiet of ponds and marshes, Frankie thrived in the urban jungle. He was no ordinary frog; he walked on two legs and conversed just as any human would. His favorite pastime, much to everyone’s amusement, was hopping around the city's many parks and cafes in search of the perfect sandwich.

Frankie's love for sandwiches was born one sunny afternoon when he stumbled upon a picnic in Central Park. The delightful smells lured him to a basket from which peeked the most enticing array of sandwiches he had ever seen. He bravely hopped up to the basket, and the picnickers, charmed by his audacity and genteel manners, offered him a taste. It was a heavenly experience for Frankie, one that sparked his unending quest for more scrumptious varieties.

Every day, Frankie would put on his little hat and matching vest, looking every bit the gentleman, and make his way to "The Bread & Bug", a popular deli known for its innovative and mouth-watering sandwiches. The owner, a kind-hearted lady named Mrs. Appleby, had taken a particular liking to Frankie. She even created a special sandwich just for him: the "Froggy Delight", packed with a mix of flies, crickets, and a dash of spicy mustard, nestled between two slices of rye bread.

Frankie's reputation as a connoisseur of sandwiches grew, attracting the attention of locals and tourists alike. Children adored him, and adults were fascinated by his ability to discuss anything from the weather to the complexities of city life. Frankie was more than happy to share stories of his adventures over a sandwich, his eyes gleaming with excitement as he recounted his escapades.

As Frankie continued his explorations, he became something of an urban legend—a talking, walking frog with a penchant for sandwiches and tales. His love for the city and its many flavors brought joy to all who met him, making the vast city feel a little more like home. In the heart of the concrete jungle, Frankie the frog found his niche, hopping happily from one sandwich adventure to the next.
`;

let myFrogChunks = await chunkit(
    frogText,
    {
        maxTokenSize: 500,
        similarityThreshold: .3,
        combineSimilarityChunks: false,
        logging: true
    });


console.log("");
console.log("myFrogChunks:");
console.log(myFrogChunks);
