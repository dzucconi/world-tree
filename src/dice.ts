export type Generation = {
  values: number[];
  /** For each face, the index of the face on the previous die it was rolled from. */
  parents: number[];
};

export const SEED: Generation = { values: [1, 2, 3, 4, 5, 6], parents: [] };

/**
 * Rolls the previous die once per face to build the next one. Faces are
 * ordered by their parent so that lineages never cross.
 */
export const descend = (prev: Generation): Generation => {
  const n = prev.values.length;
  const parents = Array.from({ length: n }, () =>
    Math.floor(Math.random() * n),
  ).sort((a, b) => a - b);

  return { values: parents.map((p) => prev.values[p]!), parents };
};

export const isUniform = ({ values }: Generation) =>
  values.every((value) => value === values[0]);

/** Per generation, the faces that still have descendants in the latest one. */
export const survivors = (generations: Generation[]): Set<number>[] => {
  const alive: Set<number>[] = new Array(generations.length);
  let current = new Set(generations.at(-1)!.values.keys());

  for (let g = generations.length - 1; g >= 0; g--) {
    alive[g] = current;
    const { parents } = generations[g]!;
    current = new Set([...current].map((i) => parents[i]!));
  }

  return alive;
};
