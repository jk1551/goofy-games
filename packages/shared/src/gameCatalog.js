export const GAME_STATUS = Object.freeze({
  AVAILABLE: "available",
  COMING_SOON: "coming-soon"
});

export const GAME_CATALOG = Object.freeze([
  {
    id: "bluff-party",
    name: "Bluff Party",
    description: "Invent believable lies, spot the truth, and fool your friends.",
    emoji: "🎭",
    minPlayers: 3,
    maxPlayers: 10,
    status: GAME_STATUS.AVAILABLE,
    accent: "purple"
  },
  {
    id: "quick-draw",
    name: "Quick Draw",
    description: "Draw strange prompts and race to identify everyone else's art.",
    emoji: "✏️",
    minPlayers: 3,
    maxPlayers: 12,
    status: GAME_STATUS.COMING_SOON,
    accent: "yellow"
  },
  {
    id: "majority-rules",
    name: "Majority Rules",
    description: "Predict the answer the room will choose most often.",
    emoji: "🗳️",
    minPlayers: 3,
    maxPlayers: 16,
    status: GAME_STATUS.COMING_SOON,
    accent: "blue"
  },
  {
    id: "closest-wins",
    name: "Closest Wins",
    description: "Make your best numerical guess without going overboard.",
    emoji: "🎯",
    minPlayers: 2,
    maxPlayers: 16,
    status: GAME_STATUS.COMING_SOON,
    accent: "green"
  }
]);
