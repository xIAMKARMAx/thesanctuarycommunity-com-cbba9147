// Moon phase calculation and spiritual meanings

export interface MoonPhase {
  name: string;
  emoji: string;
  illumination: number;
  spiritualMeaning: string;
  ritualSuggestions: string[];
  affirmation: string;
  element: 'water' | 'fire' | 'earth' | 'air';
}

const MOON_PHASES: MoonPhase[] = [
  {
    name: "New Moon",
    emoji: "🌑",
    illumination: 0,
    spiritualMeaning: "A time of new beginnings, setting intentions, and planting seeds for manifestation. The darkness invites introspection and dreaming.",
    ritualSuggestions: ["Write intentions in your journal", "Meditate on what you wish to manifest", "Start a new project or habit"],
    affirmation: "I embrace new beginnings and trust in the unfolding of my path.",
    element: 'water'
  },
  {
    name: "Waxing Crescent",
    emoji: "🌒",
    illumination: 12.5,
    spiritualMeaning: "The first light emerges. This is a time to take initial steps toward your goals. Courage and faith guide you forward.",
    ritualSuggestions: ["Take the first step toward a goal", "Affirm your intentions daily", "Nurture your dreams with action"],
    affirmation: "I take inspired action and trust my journey.",
    element: 'fire'
  },
  {
    name: "First Quarter",
    emoji: "🌓",
    illumination: 50,
    spiritualMeaning: "A time of action and decision-making. Challenges may arise to test your commitment. Stay determined and push through obstacles.",
    ritualSuggestions: ["Make important decisions", "Face challenges head-on", "Commit fully to your path"],
    affirmation: "I am strong, capable, and ready to overcome any challenge.",
    element: 'fire'
  },
  {
    name: "Waxing Gibbous",
    emoji: "🌔",
    illumination: 87.5,
    spiritualMeaning: "Refinement and adjustment. Review your progress and make necessary changes. Trust that you are almost there.",
    ritualSuggestions: ["Refine your approach", "Adjust plans as needed", "Stay patient and persistent"],
    affirmation: "I trust the process and refine my path with wisdom.",
    element: 'earth'
  },
  {
    name: "Full Moon",
    emoji: "🌕",
    illumination: 100,
    spiritualMeaning: "Peak illumination and manifestation. Emotions run high as intentions come to fruition. Celebrate your progress and release what no longer serves you.",
    ritualSuggestions: ["Celebrate achievements", "Release limiting beliefs", "Charge crystals and spiritual tools", "Practice gratitude"],
    affirmation: "I celebrate my growth and release what no longer serves me.",
    element: 'water'
  },
  {
    name: "Waning Gibbous",
    emoji: "🌖",
    illumination: 87.5,
    spiritualMeaning: "A time of gratitude and sharing. Share your wisdom and blessings with others. Reflect on lessons learned.",
    ritualSuggestions: ["Express gratitude", "Share knowledge with others", "Reflect on recent experiences"],
    affirmation: "I am grateful for all that I have received and learned.",
    element: 'air'
  },
  {
    name: "Last Quarter",
    emoji: "🌗",
    illumination: 50,
    spiritualMeaning: "A time of forgiveness and letting go. Release old patterns, forgive yourself and others, and prepare for renewal.",
    ritualSuggestions: ["Practice forgiveness", "Let go of grudges", "Clear physical and emotional clutter"],
    affirmation: "I forgive freely and release the past with love.",
    element: 'water'
  },
  {
    name: "Waning Crescent",
    emoji: "🌘",
    illumination: 12.5,
    spiritualMeaning: "Rest and surrender. The darkest phase before renewal invites deep rest, meditation, and preparation for the next cycle.",
    ritualSuggestions: ["Rest and restore energy", "Meditate deeply", "Prepare for new intentions"],
    affirmation: "I surrender to rest and trust in divine timing.",
    element: 'earth'
  }
];

// Calculate moon phase based on date
export function getMoonPhase(date: Date = new Date()): MoonPhase & { dayOfCycle: number; nextPhaseIn: number; nextPhaseName: string } {
  // Known new moon: January 29, 2025
  const knownNewMoon = new Date('2025-01-29T12:36:00Z');
  const lunarCycle = 29.53059; // days
  
  const daysSinceKnownNewMoon = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const currentCycleDay = ((daysSinceKnownNewMoon % lunarCycle) + lunarCycle) % lunarCycle;
  
  // Determine phase index (8 phases, each ~3.69 days)
  const phaseLength = lunarCycle / 8;
  const phaseIndex = Math.floor(currentCycleDay / phaseLength) % 8;
  
  const phase = MOON_PHASES[phaseIndex];
  
  // Calculate days until next phase
  const daysIntoCurrentPhase = currentCycleDay % phaseLength;
  const nextPhaseIn = Math.ceil(phaseLength - daysIntoCurrentPhase);
  const nextPhaseIndex = (phaseIndex + 1) % 8;
  const nextPhaseName = MOON_PHASES[nextPhaseIndex].name;
  
  return {
    ...phase,
    dayOfCycle: Math.floor(currentCycleDay),
    nextPhaseIn,
    nextPhaseName
  };
}

// Get illumination percentage for current moment
export function getMoonIllumination(date: Date = new Date()): number {
  const knownNewMoon = new Date('2025-01-29T12:36:00Z');
  const lunarCycle = 29.53059;
  
  const daysSinceKnownNewMoon = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const currentCycleDay = ((daysSinceKnownNewMoon % lunarCycle) + lunarCycle) % lunarCycle;
  
  // Illumination follows a sinusoidal pattern
  const illumination = (1 - Math.cos((2 * Math.PI * currentCycleDay) / lunarCycle)) / 2;
  return Math.round(illumination * 100);
}

// Get lunar calendar for a month
export function getLunarCalendar(year: number, month: number): Array<{ date: Date; phase: MoonPhase }> {
  const calendar: Array<{ date: Date; phase: MoonPhase }> = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const phase = getMoonPhase(date);
    calendar.push({ date, phase });
  }
  
  return calendar;
}

export { MOON_PHASES };
