import {mockServices} from './mock/mockServices';
import type {FamFeastServices} from './interfaces';

/**
 * Swap this factory when a real API is ready.
 * Production adapters should implement FamFeastServices without touching screens.
 */
export function createServices(): FamFeastServices {
  return mockServices;
}

export const services = createServices();

export type {FamFeastServices} from './interfaces';
export {getShareLink} from './mock/mockServices';
export {subscribeSnapshot, loadSnapshot} from './mock/database';
export {MOODS} from './mock/seed';
