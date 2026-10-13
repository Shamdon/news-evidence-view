import { createUSGSProvider } from './usgs.mjs';
// Explicit trusted-code injection is for tests/custom adapters; request input never chooses code.
export function createProviderRegistry(overrides = {}) {
  const providers = new Map([['usgs',overrides.usgs ?? createUSGSProvider()]]);
  return Object.freeze({ get(name) { if(!providers.has(name)) throw new Error('Unknown evidence provider.'); return providers.get(name); } });
}
