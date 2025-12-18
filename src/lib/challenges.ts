import { DailyChallenge } from "@/types/game";

// Pool of daily challenges with various creative prompts
const CHALLENGE_POOL: Omit<DailyChallenge, "id" | "date">[] = [
  // {
  //   title: 'Create something hot',
  //   description: 'Craft an element that radiates heat or fire',
  //   emoji: '🔥',
  // }
  {
    title: "Discover Something Alive",
    description: "Create an element that breathes, grows, or moves on its own",
    emoji: "🌱",
  },
  {
    title: "Make Something Cosmic",
    description: "Craft an element from the stars, planets, or the void beyond",
    emoji: "🌌",
  },
  {
    title: "Invent a Concept",
    description: "Create something abstract that doesn't physically exist",
    emoji: "🧠",
  },
  {
    title: "Craft Something Cursed",
    description:
      "Make the most bizarre, uncomfortable, or unsettling combination",
    emoji: "😈",
  },
  {
    title: "Build a Transportation Method",
    description: "Create a way to move from one place to another",
    emoji: "🚀",
  },
  {
    title: "Create a Villain",
    description: "Craft something dark, dangerous, or downright evil",
    emoji: "🦹",
  },
  {
    title: "Invent Impossible Food",
    description: "Make a dish that shouldn't exist but somehow does",
    emoji: "🍕",
  },
  {
    title: "Discover Pure Energy",
    description: "Create something that's raw power in its purest form",
    emoji: "⚡",
  },
  {
    title: "Make Something Magical",
    description: "Craft an element that defies the laws of nature",
    emoji: "✨",
  },
  {
    title: "Create a Weather Phenomenon",
    description: "Invent a new type of weather or atmospheric condition",
    emoji: "🌪️",
  },
  {
    title: "Build Something Mechanical",
    description: "Create a machine, tool, or device with moving parts",
    emoji: "⚙️",
  },
  {
    title: "Discover an Emotion",
    description: "Craft a feeling, mood, or state of mind",
    emoji: "💭",
  },
  {
    title: "Make Something Ancient",
    description: "Create an element from the dawn of time",
    emoji: "🗿",
  },
  {
    title: "Create a Natural Disaster",
    description: "Make something destructive and powerful from nature",
    emoji: "🌋",
  },
  {
    title: "Craft Something Tiny",
    description: "Create the smallest thing you can imagine",
    emoji: "🔬",
  },
  {
    title: "Make Something Huge",
    description: "Build something massive, colossal, or gigantic",
    emoji: "🏔️",
  },
  {
    title: "Discover a Sound",
    description: "Create something audible, musical, or noisy",
    emoji: "🎵",
  },
  {
    title: "Invent a Paradox",
    description: "Make something that contradicts itself",
    emoji: "♾️",
  },
  {
    title: "Create Something Beautiful",
    description: "Craft the most aesthetically pleasing element you can",
    emoji: "🌺",
  },
  {
    title: "Make a Mystery",
    description: "Create something unexplained and unknowable",
    emoji: "🔮",
  },
  {
    title: "Build a Home",
    description: "Craft a dwelling, shelter, or place of comfort",
    emoji: "🏠",
  },
  {
    title: "Discover a Color",
    description: "Create a hue that's never been seen before",
    emoji: "🎨",
  },
  {
    title: "Make Something Spicy",
    description: "Craft an element with heat, kick, or intensity",
    emoji: "🌶️",
  },
  {
    title: "Create a Celebration",
    description: "Make something festive, joyful, or party-worthy",
    emoji: "🎉",
  },
  // {
  //   title: "Invent a Language",
  //   description: "Create a system of communication or expression",
  //   emoji: "💬",
  // },
  {
    title: "Make Something Cold",
    description: "Craft the chilliest, frostiest element possible",
    emoji: "❄️",
  },
  {
    title: "Create a Treasure",
    description: "Make something precious, valuable, or coveted",
    emoji: "💎",
  },
  {
    title: "Build a Weapon",
    description: "Craft something designed for combat or destruction",
    emoji: "⚔️",
  },
  {
    title: "Discover Wisdom",
    description: "Create knowledge, insight, or enlightenment",
    emoji: "📚",
  },
];

/**
 * Gets a deterministic challenge based on the current date
 * Same date = same challenge for everyone
 */
export function getDailyChallenge(): DailyChallenge {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateStr = today.toISOString().split("T")[0];

  // Use date as seed for deterministic random selection
  const seed = dateStr
    .split("-")
    .reduce((acc, part) => acc + parseInt(part), 0);
  const index = seed % CHALLENGE_POOL.length;

  return {
    ...CHALLENGE_POOL[index],
    id: `challenge-${dateStr}`,
    date: dateStr,
  };
}

/**
 * Gets the challenge for a specific date (for testing or viewing past challenges)
 */
export function getChallengeForDate(date: Date): DailyChallenge {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dateStr = d.toISOString().split("T")[0];

  const seed = dateStr
    .split("-")
    .reduce((acc, part) => acc + parseInt(part), 0);
  const index = seed % CHALLENGE_POOL.length;

  return {
    ...CHALLENGE_POOL[index],
    id: `challenge-${dateStr}`,
    date: dateStr,
  };
}
