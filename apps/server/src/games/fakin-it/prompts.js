export const FAKIN_IT_ROUNDS = Object.freeze([
  Object.freeze({
    id: "hands-of-truth",
    name: "Hands of Truth",
    emoji: "✋",
    mode: "gesture",
    prompts: Object.freeze([
      "Raise your hand if you've reheated the same cup of coffee more than once.",
      "Raise your hand if you have an unread notification that's more than a week old.",
      "Raise your hand if you've pretended not to see someone so you could avoid small talk."
    ])
  }),
  Object.freeze({
    id: "number-pressure",
    name: "Number Pressure",
    emoji: "🔢",
    mode: "gesture",
    prompts: Object.freeze([
      "Hold up 0–10 fingers: how many alarms do you usually set for the morning?",
      "Hold up 0–10 fingers: how much do you like pineapple on pizza?",
      "Hold up 0–10 fingers: how many browser tabs do you think you have open right now?"
    ])
  }),
  Object.freeze({
    id: "you-gotta-point",
    name: "You Gotta Point",
    emoji: "👉",
    mode: "gesture",
    prompts: Object.freeze([
      "Point at the player most likely to survive a week on a deserted island.",
      "Point at the player most likely to accidentally become internet famous.",
      "Point at the player you'd trust most to plan a surprise party."
    ])
  }),
  Object.freeze({
    id: "face-value",
    name: "Face Value",
    emoji: "😬",
    mode: "gesture",
    prompts: Object.freeze([
      "Make the face you'd make if you opened the fridge and your leftovers were gone.",
      "Make the face you'd make after sending a risky text to the wrong person.",
      "Make the face you'd make if someone said, 'We need to talk.'"
    ])
  }),
  Object.freeze({
    id: "text-you-up",
    name: "Text You Up",
    emoji: "💬",
    mode: "text",
    prompts: Object.freeze([
      Object.freeze({
        question: "What is something you would never lend to a friend?",
        fakerQuestion: "What is something you borrow from friends pretty often?"
      }),
      Object.freeze({
        question: "What app do you open first when you're bored?",
        fakerQuestion: "What app wastes the most of your time?"
      }),
      Object.freeze({
        question: "What food would be the worst thing to eat in a quiet room?",
        fakerQuestion: "What food is impossible to eat without making a mess?"
      })
    ])
  })
]);
