// Oracle Card deck with spiritual meanings
export interface OracleCard {
  id: string;
  name: string;
  image: string; // emoji for now
  upright: string;
  reversed: string;
  affirmation: string;
  element: 'fire' | 'water' | 'earth' | 'air' | 'spirit';
}

export const ORACLE_DECK: OracleCard[] = [
  {
    id: 'new_beginnings',
    name: 'New Beginnings',
    image: '🌅',
    upright: 'Fresh starts, new opportunities, and the dawn of a new chapter in your journey.',
    reversed: 'Fear of change, resistance to new paths, or delayed starts.',
    affirmation: 'I embrace each new day with open arms and an open heart.',
    element: 'fire',
  },
  {
    id: 'inner_wisdom',
    name: 'Inner Wisdom',
    image: '🦉',
    upright: 'Trust your intuition, deep knowing, and spiritual insight guide you.',
    reversed: 'Ignoring inner guidance, confusion, or seeking external validation.',
    affirmation: 'I trust the wisdom that resides within me.',
    element: 'air',
  },
  {
    id: 'divine_love',
    name: 'Divine Love',
    image: '💗',
    upright: 'Unconditional love, deep connection, and heart-centered relationships.',
    reversed: 'Self-neglect, closed heart, or love with conditions.',
    affirmation: 'I am worthy of love and give love freely.',
    element: 'water',
  },
  {
    id: 'sacred_union',
    name: 'Sacred Union',
    image: '🔮',
    upright: 'Soul connection, partnership harmony, and divine masculine-feminine balance.',
    reversed: 'Imbalance in relationships, codependency, or disconnection.',
    affirmation: 'I honor the sacred bond between souls.',
    element: 'spirit',
  },
  {
    id: 'transformation',
    name: 'Transformation',
    image: '🦋',
    upright: 'Profound change, spiritual evolution, and releasing the old self.',
    reversed: 'Resistance to change, stagnation, or incomplete transformation.',
    affirmation: 'I embrace my metamorphosis with grace.',
    element: 'fire',
  },
  {
    id: 'abundance',
    name: 'Abundance',
    image: '🌻',
    upright: 'Prosperity in all forms, gratitude, and receiving blessings.',
    reversed: 'Scarcity mindset, blocking abundance, or ingratitude.',
    affirmation: 'I am open to receiving abundance in all forms.',
    element: 'earth',
  },
  {
    id: 'healing_light',
    name: 'Healing Light',
    image: '✨',
    upright: 'Emotional healing, spiritual restoration, and divine intervention.',
    reversed: 'Unhealed wounds, avoiding shadow work, or delayed healing.',
    affirmation: 'I allow healing light to flow through every part of my being.',
    element: 'spirit',
  },
  {
    id: 'patience',
    name: 'Patience',
    image: '🌙',
    upright: 'Divine timing, trust the process, and allowing things to unfold.',
    reversed: 'Impatience, forcing outcomes, or missing signs.',
    affirmation: 'I trust in divine timing and remain patient.',
    element: 'water',
  },
  {
    id: 'courage',
    name: 'Courage',
    image: '🦁',
    upright: 'Bravery, facing fears, and stepping into your power.',
    reversed: 'Hiding from challenges, self-doubt, or cowardice.',
    affirmation: 'I have the courage to face any challenge.',
    element: 'fire',
  },
  {
    id: 'grounding',
    name: 'Grounding',
    image: '🌳',
    upright: 'Stability, connection to earth, and being present.',
    reversed: 'Feeling ungrounded, scattered energy, or disconnection.',
    affirmation: 'I am rooted, stable, and connected to the earth.',
    element: 'earth',
  },
  {
    id: 'intuition',
    name: 'Intuition',
    image: '👁️',
    upright: 'Third eye awakening, psychic insights, and seeing beyond the veil.',
    reversed: 'Ignoring gut feelings, clouded vision, or spiritual blocks.',
    affirmation: 'I see clearly with my inner eye.',
    element: 'air',
  },
  {
    id: 'protection',
    name: 'Protection',
    image: '🛡️',
    upright: 'Divine protection, spiritual shielding, and safe boundaries.',
    reversed: 'Vulnerability, weakened defenses, or boundary violations.',
    affirmation: 'I am divinely protected at all times.',
    element: 'spirit',
  },
  {
    id: 'joy',
    name: 'Joy',
    image: '☀️',
    upright: 'Happiness, celebration, and finding bliss in simple moments.',
    reversed: 'Suppressed joy, pessimism, or unable to celebrate.',
    affirmation: 'I choose joy in every moment.',
    element: 'fire',
  },
  {
    id: 'release',
    name: 'Release',
    image: '🍂',
    upright: 'Letting go, surrender, and freeing yourself from the past.',
    reversed: 'Holding on, unable to release, or emotional baggage.',
    affirmation: 'I release what no longer serves my highest good.',
    element: 'air',
  },
  {
    id: 'manifestation',
    name: 'Manifestation',
    image: '⭐',
    upright: 'Dreams coming true, powerful creation, and aligned action.',
    reversed: 'Blocked manifestations, unclear intentions, or misaligned energy.',
    affirmation: 'I am a powerful manifestor of my dreams.',
    element: 'spirit',
  },
  {
    id: 'harmony',
    name: 'Harmony',
    image: '☯️',
    upright: 'Balance, peace, and alignment of mind, body, and spirit.',
    reversed: 'Discord, imbalance, or inner conflict.',
    affirmation: 'I am in perfect harmony with the universe.',
    element: 'water',
  },
  {
    id: 'clarity',
    name: 'Clarity',
    image: '💎',
    upright: 'Clear thinking, truth revealed, and mental sharpness.',
    reversed: 'Confusion, deception, or clouded judgment.',
    affirmation: 'I see the truth clearly in all situations.',
    element: 'air',
  },
  {
    id: 'nurturing',
    name: 'Nurturing',
    image: '🌸',
    upright: 'Self-care, compassion, and gentle healing energy.',
    reversed: 'Neglecting self, over-giving, or emotional exhaustion.',
    affirmation: 'I nurture myself with love and compassion.',
    element: 'water',
  },
  {
    id: 'strength',
    name: 'Strength',
    image: '⚡',
    upright: 'Inner power, resilience, and overcoming obstacles.',
    reversed: 'Weakness, giving up, or feeling powerless.',
    affirmation: 'I am strong beyond measure.',
    element: 'fire',
  },
  {
    id: 'connection',
    name: 'Connection',
    image: '🌐',
    upright: 'Unity, soul bonds, and interconnectedness of all beings.',
    reversed: 'Isolation, disconnection, or broken bonds.',
    affirmation: 'I am connected to all that is.',
    element: 'spirit',
  },
  {
    id: 'gratitude',
    name: 'Gratitude',
    image: '🙏',
    upright: 'Thankfulness, appreciation, and counting blessings.',
    reversed: 'Taking things for granted, entitlement, or ingratitude.',
    affirmation: 'I am grateful for every blessing in my life.',
    element: 'earth',
  },
  {
    id: 'truth',
    name: 'Truth',
    image: '🔥',
    upright: 'Authenticity, speaking your truth, and honest expression.',
    reversed: 'Deception, hiding truth, or inauthenticity.',
    affirmation: 'I speak and live my truth with courage.',
    element: 'fire',
  },
];

export function drawRandomCard(): { card: OracleCard; isReversed: boolean } {
  const card = ORACLE_DECK[Math.floor(Math.random() * ORACLE_DECK.length)];
  const isReversed = Math.random() < 0.3; // 30% chance of reversed
  return { card, isReversed };
}

export function getElementColor(element: OracleCard['element']): string {
  const colors: Record<OracleCard['element'], string> = {
    fire: 'text-orange-500',
    water: 'text-blue-500',
    earth: 'text-green-600',
    air: 'text-sky-400',
    spirit: 'text-purple-500',
  };
  return colors[element];
}

export function getElementBg(element: OracleCard['element']): string {
  const colors: Record<OracleCard['element'], string> = {
    fire: 'bg-orange-500/10 border-orange-500/30',
    water: 'bg-blue-500/10 border-blue-500/30',
    earth: 'bg-green-600/10 border-green-600/30',
    air: 'bg-sky-400/10 border-sky-400/30',
    spirit: 'bg-purple-500/10 border-purple-500/30',
  };
  return colors[element];
}
