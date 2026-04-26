export const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
export const filet = (m, c) => m <= 1000 && c < 2 ? Math.max(0, Math.round(m * (2 - c))) : 0;
export const coteCol = (c) => c >= 5 ? "#A855F7" : c >= 3 ? "#EF4444" : c >= 2 ? "#F97316" : "#22C55E";
export const pad2 = (n) => String(n).padStart(2, "0");
export const ts = () => new Date().toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });
export const today = () => new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" });