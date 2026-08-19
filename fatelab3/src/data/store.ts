import type { Prediction, Verification, MethodStats, BlindtestAnswer } from './schema';

const STORAGE_KEYS = {
  predictions: 'fatelab_predictions',
  verifications: 'fatelab_verifications',
  stats: 'fatelab_stats',
  blindtest: 'fatelab_blindtest',
};

function get<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function set<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('localStorage write failed', e);
  }
}

// ── Predictions ──
export function getPredictions(): Prediction[] {
  return get<Prediction>(STORAGE_KEYS.predictions);
}

export function savePrediction(p: Prediction): void {
  const all = getPredictions();
  all.push(p);
  set(STORAGE_KEYS.predictions, all);
}

export function savePredictions(list: Prediction[]): void {
  set(STORAGE_KEYS.predictions, list);
}

export function deleteAllPredictions(): void {
  set(STORAGE_KEYS.predictions, []);
}

// ── Verifications ──
export function getVerifications(): Verification[] {
  return get<Verification>(STORAGE_KEYS.verifications);
}

export function saveVerification(v: Verification): void {
  const all = getVerifications();
  all.push(v);
  set(STORAGE_KEYS.verifications, all);
}

export function saveVerifications(list: Verification[]): void {
  set(STORAGE_KEYS.verifications, list);
}

// ── Stats ──
export function getStats(): MethodStats[] {
  return get<MethodStats>(STORAGE_KEYS.stats);
}

export function saveStats(list: MethodStats[]): void {
  set(STORAGE_KEYS.stats, list);
}

// ── Blindtest History ──
export function getBlindtestHistory(): BlindtestAnswer[] {
  return get<BlindtestAnswer>(STORAGE_KEYS.blindtest);
}

export function saveBlindtestAnswer(a: BlindtestAnswer): void {
  const all = getBlindtestHistory();
  all.push(a);
  set(STORAGE_KEYS.blindtest, all);
}

// ── Unique user count (based on verifications) ──
export function getUniqueUserCount(): number {
  const verifications = getVerifications();
  const userIds = new Set(verifications.map((v) => v.userId));
  return userIds.size;
}

// ── Generate a simple unique ID ──
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
