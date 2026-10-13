/** Only trusted code registers executable extensions. Case data cannot select modules. */
export function createComposition({ layers = [], services = {} } = {}) {
  const ids = new Set(); let disposed = false;
  const instances = [];
  try {
    for (const descriptor of layers) {
      if (!descriptor.id || ids.has(descriptor.id) || typeof descriptor.create !== 'function') throw new Error('Invalid geographic extension.');
      ids.add(descriptor.id);
      for (const name of descriptor.requires ?? []) if (!(name in services)) throw new Error(`Missing extension service: ${name}`);
      const instance = descriptor.create(services);
      if (!instance || !['enable','disable','update','dispose'].every(name => typeof instance[name] === 'function')) throw new Error('Invalid geographic lifecycle.');
      instances.push(instance); instance.enable();
    }
  } catch (error) { for (const instance of instances.reverse()) instance.dispose(); throw error; }
  return {
    update(model) { if (!disposed) for (const layer of instances) layer.update(model); },
    enable() { if (!disposed) for (const layer of instances) layer.enable(); },
    disable() { if (!disposed) for (const layer of instances) layer.disable(); },
    dispose() { if (disposed) return; disposed = true; for (const layer of [...instances].reverse()) layer.dispose(); },
    count: instances.length
  };
}
