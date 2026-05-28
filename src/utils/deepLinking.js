import { Linking } from 'react-native';
import { navigateRef } from './navigationRef';

/* ── Linking config pour NavigationContainer ── */
export const LINKING_CONFIG = {
  prefixes: ['skillz://', 'https://skillz.app'],
  config: {
    screens: {
      MainTabs: '',
      DefiChallenge: {
        path: 'defi/:defiId',
        parse: { defiId: (id) => id },
      },
    },
  },
};

/* ── Générer l'URL de partage ── */
export function generateDefiUrl(defiId) {
  return `https://skillz.app/defi/${defiId}`;
}

/* ── Message WhatsApp ── */
export function generateWhatsAppMessage({ defiId, creatorName, defiNom, mise, performance }) {
  const url = generateDefiUrl(defiId);
  const perf = formatPerformance(performance);
  return (
    `⚡ *SKILL'Z* — ${creatorName} te lance un défi !\n\n` +
    `🎯 *${defiNom}*\n` +
    `💰 Mise : *${mise?.toLocaleString('fr-FR')} FCFA*\n` +
    `📊 Ma perf : *${perf}*\n\n` +
    `Tu penses faire mieux ? 👊\n` +
    `${url}`
  );
}

export function formatPerformance(perf) {
  if (!perf) return 'N/A';
  if (perf.reps)  return `${perf.reps} reps`;
  if (perf.time)  return `${perf.time}s`;
  if (perf.score) return `${perf.score} pts`;
  return 'Complété';
}

/* ── Ouvrir WhatsApp ── */
export async function shareViaWhatsApp(message) {
  const encoded = encodeURIComponent(message);
  const url     = `whatsapp://send?text=${encoded}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    // Fallback — partage natif
    const { Share } = require('react-native');
    await Share.share({ message });
  }
}