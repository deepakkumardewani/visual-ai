import type { ExploreFeedItem } from '@/types';

/** Test fixtures only — production Explore feed uses GET /explore/feed. */
export type CommunityFeedItem = ExploreFeedItem;

export const COMMUNITY_FEED: CommunityFeedItem[] = [
  {
    id: 'cf-001',
    imageUrl: '/landing/gallery-ofccaxq9nly01yi9nhcq.1431a3dc.webp',
    author: 'neon_skylines',
    authorUserId: 'user-001',
    modelName: 'Flux Basic',
    prompt:
      'A futuristic city skyline at dusk, with glowing neon lights reflecting off sleek glass buildings, flying cars zooming by, and a vibrant sunset fading into the horizon.',
    aspectRatio: '2:3',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cf-002',
    imageUrl: '/landing/gallery-jhquao95wd3gtiikz5uy.7497147d.webp',
    author: 'forest_whisper',
    authorUserId: 'user-002',
    modelName: 'Flux Basic',
    prompt:
      'An enchanted forest filled with towering ancient trees, bioluminescent plants glowing in shades of purple and green, and mystical creatures like fairies and glowing deer roaming through misty air.',
    aspectRatio: '2:3',
    createdAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'cf-003',
    imageUrl: '/landing/gallery-htfs4vc03mdbyf7mv6wf.19917cbf.webp',
    author: 'cyber_vendor',
    authorUserId: 'user-003',
    modelName: 'Flux Pro',
    prompt:
      'A cyberpunk marketplace in a rainy alley, lit by holographic advertisements and neon signs, with vendors selling futuristic technology, androids passing by, and people in high-tech attire.',
    aspectRatio: '3:2',
    createdAt: '2024-01-03T00:00:00.000Z',
  },
  {
    id: 'cf-004',
    imageUrl: '/landing/gallery-wcqinro0ha8tnmieqqvh.138e75e6.webp',
    author: 'dragonforge',
    authorUserId: 'user-004',
    modelName: 'Flux Basic',
    prompt:
      'A majestic dragon perched on top of a snow-covered mountain, overlooking a medieval kingdom in the distance, with its wings outstretched and a thunderstorm brewing in the background.',
    aspectRatio: '4:5',
    createdAt: '2024-01-04T00:00:00.000Z',
  },
  {
    id: 'cf-005',
    imageUrl: '/landing/gallery-tlj2pf9ldkpftj4rn58i.3fb42238.webp',
    author: 'zen_garden',
    authorUserId: 'user-005',
    modelName: 'Flux Basic',
    prompt:
      'A peaceful Japanese Zen garden at dawn, with a still pond reflecting cherry blossom trees, a traditional tea house in the background, and soft rays of sunlight breaking through a light mist.',
    aspectRatio: '4:5',
    createdAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'cf-006',
    imageUrl: '/landing/gallery-issf6d8i728zd7pwaabs.92dce6bb.webp',
    author: 'deep_blue',
    authorUserId: 'user-006',
    modelName: 'Flux Pro',
    prompt:
      'An underwater kingdom with vibrant coral reefs, schools of exotic fish, ancient sunken ruins, and mermaids swimming gracefully among the sea creatures.',
    aspectRatio: '4:5',
    createdAt: '2024-01-06T00:00:00.000Z',
  },
  {
    id: 'cf-007',
    imageUrl: '/landing/gallery-txotpcqxitozx474wew7.2d64f603.webp',
    author: 'steam_sky',
    authorUserId: 'user-007',
    modelName: 'Flux Basic',
    prompt:
      'A steampunk airship flying above a cloud-filled sky, with massive brass gears and pipes, smoke billowing from its engines, and a sprawling Victorian city far below.',
    aspectRatio: '4:5',
    createdAt: '2024-01-07T00:00:00.000Z',
  },
  {
    id: 'cf-008',
    imageUrl: '/landing/gallery-eq7isybabahxdxtmcxzp.a6d4c645.webp',
    author: 'rebel_grid',
    authorUserId: 'user-008',
    modelName: 'Flux Basic',
    prompt:
      'A dystopian cityscape at night, with towering skyscrapers covered in graffiti, crumbling infrastructure, robotic patrols, and a group of rebels plotting in the shadows.',
    aspectRatio: '2:3',
    createdAt: '2024-01-08T00:00:00.000Z',
  },
  {
    id: 'cf-009',
    imageUrl: '/landing/gallery-jiltu5cbskl7q83lsfz2.8949e112.webp',
    author: 'meadow_light',
    authorUserId: 'user-009',
    modelName: 'Flux Pro',
    prompt:
      "A serene meadow at sunrise with wildflowers in full bloom, butterflies dancing in the air, and a crystal-clear river winding through the landscape, with a lone deer standing near the water's edge.",
    aspectRatio: '4:5',
    createdAt: '2024-01-09T00:00:00.000Z',
  },
  {
    id: 'cf-010',
    imageUrl: '/landing/gallery-umzjnrj6v3eitwjl0me8.4e8d5b78.webp',
    author: 'cosmos_drift',
    authorUserId: 'user-010',
    modelName: 'Flux Basic',
    prompt:
      'A celestial scene of planets orbiting around a massive nebula, stars twinkling in the background, and an ancient space station floating amidst the cosmic beauty.',
    aspectRatio: '4:5',
    createdAt: '2024-01-10T00:00:00.000Z',
  },
];

export function getCommunityFeedItem(id: string): CommunityFeedItem | undefined {
  return COMMUNITY_FEED.find((item) => item.id === id);
}
