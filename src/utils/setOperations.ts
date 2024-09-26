export function intersection<T>(set1: Set<T>, set2: Set<T>): Set<T> {
  return new Set([...set1].filter((element) => set2.has(element)));
}

export function difference<T>(set1: Set<T>, set2: Set<T>): Set<T> {
  return new Set([...set1].filter((element) => !set2.has(element)));
}
