import { createController } from './controller.js';
import { createApi } from './api.js';
import { createStorage } from './storage.js';
import { createComposition } from './composition.js';
/** Trusted product composition. URL flags select a finite release configuration, never modules. */
export async function initializeProduct({mapHost,onSelectEvidence}) {
  const controller = createController({api:createApi(), storage:createStorage(localStorage)});
  const configuration = new URLSearchParams(location.search).get('geography');
  let layers = [];
  if (configuration !== 'off') {
    const module = configuration === 'coordinates' ? await import('../geography/coordinate-list.js') : await import('../geography/map.js');
    layers = [configuration === 'coordinates' ? module.coordinateLayer : module.mapLayer];
  }
  const composition = createComposition({layers,services:{mapHost,onSelectEvidence,boundaries:async ({signal}) => { const response=await fetch('/assets/countries.json',{signal}); if(!response.ok) throw new Error('Boundaries unavailable'); return response.json(); }}});
  const unsubscribe = controller.subscribe(model => composition.update(model));
  return {controller,composition,geography:configuration ?? 'map',dispose(){unsubscribe();controller.dispose();composition.dispose();}};
}
