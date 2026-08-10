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
    minPlayers: 2,
    maxPlayers: 10,
    status: GAME_STATUS.AVAILABLE,
    accent: "purple",
    settings: Object.freeze([
      {
        id: "questionCount",
        label: "Questions per game",
        type: "select",
        defaultValue: 5,
        options: Object.freeze([
          { value: 3, label: "3 questions" },
          { value: 5, label: "5 questions" },
          { value: 7, label: "7 questions" },
          { value: 10, label: "10 questions" }
        ])
      }
    ])
  },
  {
    id: "fakin-it",
    name: "Fakin' It",
    description: "Follow secret social prompts while one hidden Faker tries to blend in.",
    emoji: "🕵️",
    minPlayers: 2,
    maxPlayers: 6,
    status: GAME_STATUS.AVAILABLE,
    accent: "blue"
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
