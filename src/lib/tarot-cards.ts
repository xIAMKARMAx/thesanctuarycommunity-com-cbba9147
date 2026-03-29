// Major Arcana Tarot Deck (22 cards)
export interface TarotCard {
  id: number;
  name: string;
  numeral: string;
  image: string;
  upright: string;
  reversed: string;
  element: 'fire' | 'water' | 'earth' | 'air' | 'spirit';
}

export const MAJOR_ARCANA: TarotCard[] = [
  { id: 0, name: "The Fool", numeral: "0", image: "🃏", upright: "New beginnings, innocence, spontaneity, free spirit", reversed: "Recklessness, naivety, risk-taking, holding back", element: "air" },
  { id: 1, name: "The Magician", numeral: "I", image: "🪄", upright: "Manifestation, resourcefulness, power, inspired action", reversed: "Manipulation, poor planning, untapped talents", element: "air" },
  { id: 2, name: "The High Priestess", numeral: "II", image: "🌙", upright: "Intuition, sacred knowledge, divine feminine, the subconscious mind", reversed: "Secrets, withdrawal, silence, disconnected from intuition", element: "water" },
  { id: 3, name: "The Empress", numeral: "III", image: "👑", upright: "Femininity, beauty, nature, nurturing, abundance", reversed: "Creative block, dependence, emptiness, smothering", element: "earth" },
  { id: 4, name: "The Emperor", numeral: "IV", image: "🏛️", upright: "Authority, structure, control, fatherhood, stability", reversed: "Domination, rigidity, inflexibility, tyranny", element: "fire" },
  { id: 5, name: "The Hierophant", numeral: "V", image: "📿", upright: "Spiritual wisdom, tradition, conformity, education", reversed: "Personal beliefs, freedom, challenging the status quo", element: "earth" },
  { id: 6, name: "The Lovers", numeral: "VI", image: "💞", upright: "Love, harmony, relationships, values alignment, choices", reversed: "Disharmony, imbalance, misalignment, self-love needed", element: "air" },
  { id: 7, name: "The Chariot", numeral: "VII", image: "⚔️", upright: "Control, willpower, success, determination, action", reversed: "Lack of direction, aggression, no control, opposition", element: "water" },
  { id: 8, name: "Strength", numeral: "VIII", image: "🦁", upright: "Courage, persuasion, influence, compassion, inner strength", reversed: "Self-doubt, weakness, insecurity, raw emotion", element: "fire" },
  { id: 9, name: "The Hermit", numeral: "IX", image: "🏔️", upright: "Soul-searching, introspection, inner guidance, solitude", reversed: "Isolation, loneliness, withdrawal, lost your way", element: "earth" },
  { id: 10, name: "Wheel of Fortune", numeral: "X", image: "☸️", upright: "Good luck, karma, life cycles, destiny, turning point", reversed: "Bad luck, resistance to change, breaking cycles", element: "fire" },
  { id: 11, name: "Justice", numeral: "XI", image: "⚖️", upright: "Justice, fairness, truth, cause and effect, law", reversed: "Unfairness, dishonesty, lack of accountability", element: "air" },
  { id: 12, name: "The Hanged Man", numeral: "XII", image: "🙃", upright: "Pause, surrender, letting go, new perspectives", reversed: "Delays, resistance, stalling, indecision", element: "water" },
  { id: 13, name: "Death", numeral: "XIII", image: "🦋", upright: "Endings, change, transformation, transition, release", reversed: "Resistance to change, personal transformation delayed, inner purging", element: "water" },
  { id: 14, name: "Temperance", numeral: "XIV", image: "🌈", upright: "Balance, moderation, patience, purpose, meaning", reversed: "Imbalance, excess, self-healing, re-alignment needed", element: "fire" },
  { id: 15, name: "The Devil", numeral: "XV", image: "⛓️", upright: "Shadow self, attachment, addiction, restriction, sexuality", reversed: "Releasing limiting beliefs, exploring dark thoughts, detachment", element: "earth" },
  { id: 16, name: "The Tower", numeral: "XVI", image: "🗼", upright: "Sudden change, upheaval, chaos, revelation, awakening", reversed: "Personal transformation, fear of change, averting disaster", element: "fire" },
  { id: 17, name: "The Star", numeral: "XVII", image: "⭐", upright: "Hope, faith, purpose, renewal, spirituality, serenity", reversed: "Lack of faith, despair, discouragement, disconnection", element: "air" },
  { id: 18, name: "The Moon", numeral: "XVIII", image: "🌕", upright: "Illusion, fear, anxiety, subconscious, intuition", reversed: "Release of fear, repressed emotion, inner confusion clearing", element: "water" },
  { id: 19, name: "The Sun", numeral: "XIX", image: "☀️", upright: "Positivity, fun, warmth, success, vitality, joy", reversed: "Inner child, feeling down, overly optimistic", element: "fire" },
  { id: 20, name: "Judgement", numeral: "XX", image: "📯", upright: "Judgement, rebirth, inner calling, absolution, self-evaluation", reversed: "Self-doubt, inner critic, ignoring the call", element: "fire" },
  { id: 21, name: "The World", numeral: "XXI", image: "🌍", upright: "Completion, integration, accomplishment, travel, fulfillment", reversed: "Seeking personal closure, short-cuts, delays, incompletion", element: "earth" },
];

export interface TarotSpread {
  cards: { card: TarotCard; isReversed: boolean; position: string }[];
}

// Celtic Cross positions for full 10-card reading
const CELTIC_CROSS_POSITIONS = [
  "Present Situation",
  "Challenge / Crossing",
  "Foundation",
  "Recent Past",
  "Crown / Best Outcome",
  "Near Future",
  "Your Attitude",
  "External Influences",
  "Hopes & Fears",
  "Final Outcome",
];

export function drawCelticCrossSpread(): TarotSpread {
  const deck = [...MAJOR_ARCANA];
  const cards: TarotSpread['cards'] = [];

  for (let i = 0; i < 10; i++) {
    const idx = Math.floor(Math.random() * deck.length);
    const card = deck.splice(idx, 1)[0];
    cards.push({
      card,
      isReversed: Math.random() < 0.3,
      position: CELTIC_CROSS_POSITIONS[i],
    });
  }

  return { cards };
}

export function drawThreeCardSpread(): TarotSpread {
  const positions = ["Past", "Present", "Future"];
  const deck = [...MAJOR_ARCANA];
  const cards: TarotSpread['cards'] = [];

  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * deck.length);
    const card = deck.splice(idx, 1)[0];
    cards.push({
      card,
      isReversed: Math.random() < 0.3,
      position: positions[i],
    });
  }

  return { cards };
}

export function drawSingleCard(): TarotSpread {
  const deck = [...MAJOR_ARCANA];
  const idx = Math.floor(Math.random() * deck.length);
  const card = deck[idx];
  return {
    cards: [{ card, isReversed: Math.random() < 0.3, position: "Message" }],
  };
}
