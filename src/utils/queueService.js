import AsyncStorage from '@react-native-async-storage/async-storage';
import { queueEvents } from './queueEvents';

const KEY = 'skillz_queue';

export async function getQueue() {
  try {
    const s = await AsyncStorage.getItem(KEY);
    return s ? JSON.parse(s) : [];
  } catch (_) { return []; }
}

export async function addToQueue(defi, gameKey, mise = 1000) {
  try {
    const current = await getQueue();

    const duplicate = current.some(
      q => q.id === defi.id && q.gameKey === gameKey
    );
    if (duplicate) return { success: false, reason: 'duplicate' };

    const item = {
      ...defi,
      gameKey,
      mise,
      queueId: `${defi.id}_${Date.now()}`,
      addedAt: new Date().toISOString(),
    };

    const next = [item, ...current];
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    queueEvents.emit(); // ✅ notif instantanée
    return { success: true, item };
  } catch (e) {
    return { success: false, reason: e.message };
  }
}

export async function removeFromQueue(queueId) {
  try {
    const current = await getQueue();
    const next    = current.filter(q => q.queueId !== queueId);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    queueEvents.emit(); // ✅ notif instantanée
    return { success: true };
  } catch (_) {
    return { success: false };
  }
}