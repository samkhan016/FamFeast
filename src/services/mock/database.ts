import {createMMKV} from 'react-native-mmkv';
import type {AppSnapshot} from '../../domain/types';
import {createEmptySnapshot} from './seed';
import {todayISO} from '../../utils/dates';

const STORAGE_KEY = 'famfeast.snapshot.v1';

let storage: ReturnType<typeof createMMKV> | null = null;

function getStorage() {
  if (!storage) {
    try {
      storage = createMMKV({id: 'famfeast'});
    } catch {
      storage = null;
    }
  }
  return storage;
}

let memory: AppSnapshot | null = null;
const listeners = new Set<(snapshot: AppSnapshot) => void>();

function resetDailySpins(snapshot: AppSnapshot): AppSnapshot {
  const today = todayISO();
  if (snapshot.lastSpinDate === today) {
    return snapshot;
  }
  return {...snapshot, lastSpinDate: today, spinsLeft: 3};
}

export function loadSnapshot(): AppSnapshot {
  if (memory) {
    return memory;
  }
  const store = getStorage();
  const raw = store?.getString(STORAGE_KEY);
  if (raw) {
    try {
      memory = resetDailySpins(JSON.parse(raw) as AppSnapshot);
      persistSnapshot(memory);
      return memory;
    } catch {
      // fall through to seed
    }
  }
  memory = createEmptySnapshot();
  persistSnapshot(memory);
  return memory;
}

export function persistSnapshot(next: AppSnapshot) {
  memory = next;
  const store = getStorage();
  try {
    store?.set(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // memory-only fallback
  }
  listeners.forEach(listener => listener(next));
}

export function updateSnapshot(mutator: (current: AppSnapshot) => AppSnapshot): AppSnapshot {
  const next = mutator(loadSnapshot());
  persistSnapshot(next);
  return next;
}

export function subscribeSnapshot(listener: (snapshot: AppSnapshot) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function replaceSnapshot(next: AppSnapshot): AppSnapshot {
  persistSnapshot(next);
  return next;
}

export async function simulateLatency(min = 280, max = 720): Promise<void> {
  const wait = min + Math.round(Math.random() * (max - min));
  await new Promise<void>(resolve => {
    setTimeout(resolve, wait);
  });
}

export function maybeFail(rate = 0.04): void {
  if (Math.random() < rate) {
    throw new Error('Network hiccup. Please try again.');
  }
}
