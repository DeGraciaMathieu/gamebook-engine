export const minRoll = () => 0;
export const maxRoll = () => 0.999999;

export function makeState(overrides = {}) {
  const stats = { habilete: 10, endurance: 20, chance: 8, ...(overrides.stats ?? {}) };
  return {
    storyId: 'test',
    paragraphId: '1',
    stats,
    initialStats: { ...stats, ...(overrides.initialStats ?? {}) },
    flags: {},
    inventory: [],
    combat: null,
    status: 'playing',
    ...overrides,
    stats,
  };
}

export function makeStory(paragraphs, overrides = {}) {
  return {
    id: 'test',
    title: 'Test',
    summary: '',
    start: '1',
    hero: {
      stats: {
        habilete: { label: 'Habileté', value: 10 },
        endurance: { label: 'Endurance', value: 20 },
        chance: { label: 'Chance', value: 8 },
      },
      inventory: [],
      flags: {},
    },
    items: { clef: { name: 'Clef' } },
    paragraphs,
    ...overrides,
  };
}
