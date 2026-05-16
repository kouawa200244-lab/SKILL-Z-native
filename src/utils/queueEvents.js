// Bus d'événements ultra-léger pour sync instantanée
const listeners = new Set();

export const queueEvents = {
  emit() {
    listeners.forEach(fn => {
      try { fn(); } catch (_) {}
    });
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};