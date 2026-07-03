export interface CommunityFeedItem {
  id: string;
  imageUrl: string;
  author: string;
  likes: number;
  prompt: string;
  aspectRatio: string;
}

export const COMMUNITY_FEED: CommunityFeedItem[] = [
  {
    id: "cf-001",
    imageUrl:
      "https://res.cloudinary.com/ddzuitkzt/image/upload/v1731824914/gallery/ofccaxq9nly01yi9nhcq.jpg",
    author: "neon_skylines",
    likes: 284,
    prompt:
      "A futuristic city skyline at dusk, with glowing neon lights reflecting off sleek glass buildings, flying cars zooming by, and a vibrant sunset fading into the horizon.",
    aspectRatio: "2:3",
  },
  {
    id: "cf-002",
    imageUrl:
      "https://res.cloudinary.com/ddzuitkzt/image/upload/v1731824917/gallery/jhquao95wd3gtiikz5uy.jpg",
    author: "forest_whisper",
    likes: 412,
    prompt:
      "An enchanted forest filled with towering ancient trees, bioluminescent plants glowing in shades of purple and green, and mystical creatures like fairies and glowing deer roaming through misty air.",
    aspectRatio: "2:3",
  },
  {
    id: "cf-003",
    imageUrl:
      "https://res.cloudinary.com/ddzuitkzt/image/upload/v1731824921/gallery/htfs4vc03mdbyf7mv6wf.jpg",
    author: "cyber_vendor",
    likes: 156,
    prompt:
      "A cyberpunk marketplace in a rainy alley, lit by holographic advertisements and neon signs, with vendors selling futuristic technology, androids passing by, and people in high-tech attire.",
    aspectRatio: "3:2",
  },
  {
    id: "cf-004",
    imageUrl:
      "https://res.cloudinary.com/ddzuitkzt/image/upload/v1731824923/gallery/wcqinro0ha8tnmieqqvh.jpg",
    author: "dragonforge",
    likes: 891,
    prompt:
      "A majestic dragon perched on top of a snow-covered mountain, overlooking a medieval kingdom in the distance, with its wings outstretched and a thunderstorm brewing in the background.",
    aspectRatio: "4:5",
  },
  {
    id: "cf-005",
    imageUrl:
      "https://res.cloudinary.com/ddzuitkzt/image/upload/v1731824926/gallery/tlj2pf9ldkpftj4rn58i.jpg",
    author: "zen_garden",
    likes: 327,
    prompt:
      "A peaceful Japanese Zen garden at dawn, with a still pond reflecting cherry blossom trees, a traditional tea house in the background, and soft rays of sunlight breaking through a light mist.",
    aspectRatio: "4:5",
  },
  {
    id: "cf-006",
    imageUrl:
      "https://res.cloudinary.com/ddzuitkzt/image/upload/v1731824929/gallery/issf6d8i728zd7pwaabs.jpg",
    author: "deep_blue",
    likes: 203,
    prompt:
      "An underwater kingdom with vibrant coral reefs, schools of exotic fish, ancient sunken ruins, and mermaids swimming gracefully among the sea creatures.",
    aspectRatio: "4:5",
  },
  {
    id: "cf-007",
    imageUrl:
      "https://res.cloudinary.com/ddzuitkzt/image/upload/v1731824932/gallery/txotpcqxitozx474wew7.jpg",
    author: "steam_sky",
    likes: 544,
    prompt:
      "A steampunk airship flying above a cloud-filled sky, with massive brass gears and pipes, smoke billowing from its engines, and a sprawling Victorian city far below.",
    aspectRatio: "4:5",
  },
  {
    id: "cf-008",
    imageUrl:
      "https://res.cloudinary.com/ddzuitkzt/image/upload/v1731824934/gallery/eq7isybabahxdxtmcxzp.jpg",
    author: "rebel_grid",
    likes: 178,
    prompt:
      "A dystopian cityscape at night, with towering skyscrapers covered in graffiti, crumbling infrastructure, robotic patrols, and a group of rebels plotting in the shadows.",
    aspectRatio: "2:3",
  },
  {
    id: "cf-009",
    imageUrl:
      "https://res.cloudinary.com/ddzuitkzt/image/upload/v1731824937/gallery/jiltu5cbskl7q83lsfz2.jpg",
    author: "meadow_light",
    likes: 667,
    prompt:
      "A serene meadow at sunrise with wildflowers in full bloom, butterflies dancing in the air, and a crystal-clear river winding through the landscape, with a lone deer standing near the water's edge.",
    aspectRatio: "4:5",
  },
  {
    id: "cf-010",
    imageUrl:
      "https://res.cloudinary.com/ddzuitkzt/image/upload/v1731824939/gallery/umzjnrj6v3eitwjl0me8.jpg",
    author: "cosmos_drift",
    likes: 439,
    prompt:
      "A celestial scene of planets orbiting around a massive nebula, stars twinkling in the background, and an ancient space station floating amidst the cosmic beauty.",
    aspectRatio: "4:5",
  },
];

export function getCommunityFeedItem(id: string): CommunityFeedItem | undefined {
  return COMMUNITY_FEED.find((item) => item.id === id);
}
