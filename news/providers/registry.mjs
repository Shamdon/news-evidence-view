import { createUSGSProvider } from './usgs.mjs';
// Only application composition supplies adapters. Request input cannot register or load code.
// Registered retrieval adapters currently accept the bounded seismic query contract.
export function createProviderRegistry(overrides = {}) {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides))
    throw new Error('Invalid trusted provider configuration.');
  const providers = new Map([['usgs', createUSGSProvider()]]);
  for (const [id, adapter] of Object.entries(overrides)) {
    if (
      !/^[a-z][a-z0-9-]{0,47}$/.test(id) ||
      ['constructor', 'prototype', '__proto__'].includes(id) ||
      !adapter ||
      typeof adapter.retrieve !== 'function' ||
      (adapter.acquire !== undefined && typeof adapter.acquire !== 'function')
    )
      throw new Error('Invalid trusted provider configuration.');
    providers.set(id, adapter);
  }
  return Object.freeze({
    get(name) {
      if (!providers.has(name)) throw new Error('Unknown evidence provider.');
      return providers.get(name);
    },
  });
}
