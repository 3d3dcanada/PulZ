export function deterministicHash(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return simpleHash('null');
  }
  
  if (typeof obj !== 'object') {
    return simpleHash(JSON.stringify(obj));
  }
  
  const sortedJson = JSON.stringify(obj, Object.keys(obj as object).sort());
  return simpleHash(sortedJson);
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(16);
  return hashStr.padStart(16, '0').slice(0, 16);
}

export function hashSnapshot(snapshot: unknown): string {
  return deterministicHash(snapshot);
}
