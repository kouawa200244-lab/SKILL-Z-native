// src/utils/helper.js

/**
 * Formate un nombre en chaîne lisible (ex: 1 500 000 → "1 500 000")
 */
export const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

/**
 * Calcule le filet de sécurité (remboursement partiel en cas de perte)
 * Appliqué uniquement si mise ≤ 1000 F et cote < 2.0
 */
export const filet = (m, c) =>
  m <= 1000 && c < 2 ? Math.max(0, Math.round(m * (2 - c))) : 0;

/**
 * Retourne la couleur associée à une cote
 */
export const coteCol = (c) =>
  c >= 5 ? "#A855F7" : c >= 3 ? "#EF4444" : c >= 2 ? "#F97316" : "#22C55E";

/**
 * Ajoute un zéro devant les nombres < 10 (pour horloge)
 */
export const pad2 = (n) => String(n).padStart(2, "0");

/**
 * Horodatage formaté (HH:MM)
 */
export const ts = () =>
  new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/**
 * Date du jour formatée en français (ex: vendredi 25 avril 2026)
 */
export const today = () =>
  new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });