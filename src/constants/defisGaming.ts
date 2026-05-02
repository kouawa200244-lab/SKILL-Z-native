// @ts-nocheck
// ============================================================
// src/constants/defisGaming.ts
// Catalogue complet — Jeux de combat & course
// BLUR · Naruto Storm 3&4 · FighterZ · MK · UFC · Tekken
// Cotes calibrées marge plateforme 10%
// ============================================================

// ── Types ────────────────────────────────────────────────────
export interface Defi {
  id:   string;
  p:    'debutant' | 'intermediaire' | 'avance' | 'expert' | 'legendaire';
  nom:  string;
  cond: string;
  taux: number;
  cote: number;
}

// ════════════════════════════════════════════════════════════
// 🚗 BLUR
// Course avec armes — compétence + stratégie
// ════════════════════════════════════════════════════════════
export const DEFIS_BLUR: Defi[] = [
  // DÉBUTANT
  { id:"bl1",  p:"debutant",     nom:"1ère place circuit",       cond:"Finir 1er dans une course standard (diff. normale)",                  taux:80, cote:1.10 },
  { id:"bl2",  p:"debutant",     nom:"Podium sans arme",         cond:"Finir dans le top 3 sans utiliser aucune arme",                       taux:72, cote:1.30 },
  { id:"bl3",  p:"debutant",     nom:"3 courses consécutives",   cond:"Finir dans le top 3 sur 3 courses d'affilée",                         taux:68, cote:1.40 },
  // INTERMÉDIAIRE
  { id:"bl4",  p:"intermediaire",nom:"Victoire sans dégât",      cond:"Gagner une course sans recevoir aucun dégât d'arme",                  taux:50, cote:1.80 },
  { id:"bl5",  p:"intermediaire",nom:"5 éliminations",           cond:"Éliminer 5 adversaires avec des armes dans un seul match",            taux:45, cote:2.00 },
  { id:"bl6",  p:"intermediaire",nom:"Victoire diff. max",       cond:"Finir 1er en difficulté maximale",                                    taux:40, cote:2.25 },
  // AVANCÉ
  { id:"bl7",  p:"avance",       nom:"5 courses imbattu",        cond:"Enchaîner 5 premières places sans aucune défaite",                    taux:28, cote:3.00 },
  { id:"bl8",  p:"avance",       nom:"Victoire voiture de base", cond:"Gagner en diff. max avec le véhicule non amélioré",                   taux:22, cote:3.50 },
  // EXPERT
  { id:"bl9",  p:"expert",       nom:"10 éliminations",         cond:"10 éliminations dans une seule course",                               taux:12, cote:6.00 },
  { id:"bl10", p:"expert",       nom:"10 courses imbattu",       cond:"10 premières places consécutives en difficulté max",                  taux:10, cote:6.00 },
  // LÉGENDAIRE
  { id:"bl11", p:"legendaire",   nom:"Perfection totale",        cond:"Gagner 5 courses de suite sans recevoir aucun dégât",                 taux:4,  cote:7.00 },
  { id:"bl12", p:"legendaire",   nom:"Solo vs 7 CPU max",        cond:"Gagner contre 7 adversaires CPU en difficulté max, 5 fois de suite",  taux:3,  cote:7.00 },
];

// ════════════════════════════════════════════════════════════
// 🥷 NARUTO STORM 3
// Combat ninja — maîtrise des combos et du chakra
// ════════════════════════════════════════════════════════════
export const DEFIS_NARUTO3: Defi[] = [
  // DÉBUTANT
  { id:"ns3_1", p:"debutant",     nom:"Victoire en 2 rounds",    cond:"Gagner un combat 2-0 en mode histoire ou versus CPU",                 taux:80, cote:1.10 },
  { id:"ns3_2", p:"debutant",     nom:"Sans recevoir de dégâts", cond:"Gagner un round sans recevoir aucun coup (diff. normale)",            taux:72, cote:1.30 },
  { id:"ns3_3", p:"debutant",     nom:"Victoire avec 3 perso",   cond:"Gagner avec 3 personnages différents dans la même session",           taux:68, cote:1.40 },
  // INTERMÉDIAIRE
  { id:"ns3_4", p:"intermediaire",nom:"Ultimate Jutsu parfait",  cond:"Placer un Ultimate Jutsu qui conclut le combat (KO final)",           taux:52, cote:1.60 },
  { id:"ns3_5", p:"intermediaire",nom:"Victoire sans jutsu",     cond:"Gagner un combat en utilisant uniquement les attaques basiques",      taux:45, cote:2.00 },
  { id:"ns3_6", p:"intermediaire",nom:"Combo 20+ coups",         cond:"Réaliser un combo de 20 coups ou plus sans interruption",             taux:42, cote:2.00 },
  // AVANCÉ
  { id:"ns3_7", p:"avance",       nom:"Victoire diff. Légendaire",cond:"Gagner un combat en difficulté Légendaire",                          taux:28, cote:3.00 },
  { id:"ns3_8", p:"avance",       nom:"5 Ults dans un match",    cond:"Placer 5 Ultimate Jutsu dans un seul match",                         taux:22, cote:3.50 },
  // EXPERT
  { id:"ns3_9", p:"expert",       nom:"Perfection Légendaire",   cond:"Gagner 2-0 sans recevoir de dégâts en difficulté Légendaire",        taux:12, cote:6.00 },
  { id:"ns3_10",p:"expert",       nom:"Challenge des 10",        cond:"Gagner 10 combats consécutifs sans perdre un seul round",            taux:10, cote:6.00 },
  // LÉGENDAIRE
  { id:"ns3_11",p:"legendaire",   nom:"Perso le plus faible",    cond:"Gagner en Légendaire avec le perso noté le plus faible du roster",   taux:4,  cote:7.00 },
  { id:"ns3_12",p:"legendaire",   nom:"Sans chakra",             cond:"Gagner 3 combats consécutifs sans utiliser aucun chakra",            taux:3,  cote:7.00 },
];

// ════════════════════════════════════════════════════════════
// 🥷 NARUTO STORM 4
// Plus technique — awakening, substitution, garde parfaite
// ════════════════════════════════════════════════════════════
export const DEFIS_NARUTO4: Defi[] = [
  // DÉBUTANT
  { id:"ns4_1", p:"debutant",     nom:"Victoire 2-0",            cond:"Gagner un combat 2-0 contre CPU (diff. normale)",                    taux:80, cote:1.10 },
  { id:"ns4_2", p:"debutant",     nom:"Awakening activé",        cond:"Activer l'Awakening ET gagner le combat",                            taux:72, cote:1.30 },
  { id:"ns4_3", p:"debutant",     nom:"3 victoires de suite",    cond:"Gagner 3 combats consécutifs avec le même personnage",               taux:68, cote:1.40 },
  // INTERMÉDIAIRE
  { id:"ns4_4", p:"intermediaire",nom:"Victoire sans sub",       cond:"Gagner sans utiliser la substitution une seule fois",                taux:50, cote:1.80 },
  { id:"ns4_5", p:"intermediaire",nom:"Combo 30+ coups",         cond:"Réaliser un combo de 30 coups sans interruption",                    taux:44, cote:2.00 },
  { id:"ns4_6", p:"intermediaire",nom:"Victoire parfaite",       cond:"Gagner un round sans subir aucun dégât (diff. difficile)",           taux:40, cote:2.25 },
  // AVANCÉ
  { id:"ns4_7", p:"avance",       nom:"Victoire Légendaire",     cond:"Gagner en difficulté Légendaire",                                    taux:28, cote:3.00 },
  { id:"ns4_8", p:"avance",       nom:"5 combats parfaits",      cond:"Gagner 5 rounds parfaits (0 dégât reçu) en une session",            taux:20, cote:3.50 },
  // EXPERT
  { id:"ns4_9", p:"expert",       nom:"10 victoires Légendaire", cond:"10 victoires consécutives en difficulté Légendaire",                 taux:12, cote:6.00 },
  { id:"ns4_10",p:"expert",       nom:"Sans Awakening",          cond:"Battre 5 CPU en Légendaire sans utiliser l'Awakening",               taux:10, cote:6.00 },
  // LÉGENDAIRE
  { id:"ns4_11",p:"legendaire",   nom:"Perfection absolue",      cond:"10 victoires parfaites (0 dégât) en Légendaire",                    taux:4,  cote:7.00 },
  { id:"ns4_12",p:"legendaire",   nom:"Perso D-tier Légendaire", cond:"Gagner 5 fois de suite en Légendaire avec un perso peu utilisé",    taux:3,  cote:7.00 },
];

// ════════════════════════════════════════════════════════════
// 🐉 DRAGON BALL FIGHTERZ
// Le jeu le plus technique — mixups, extensions, tag combos
// ════════════════════════════════════════════════════════════
export const DEFIS_FIGHTERZ: Defi[] = [
  // DÉBUTANT
  { id:"fz1",  p:"debutant",     nom:"Victoire en Arcade",       cond:"Terminer le mode Arcade en difficulté normale",                       taux:80, cote:1.10 },
  { id:"fz2",  p:"debutant",     nom:"Ki Blast KO",              cond:"Terminer un combat avec un Ki Blast (pas de super)",                  taux:72, cote:1.30 },
  { id:"fz3",  p:"debutant",     nom:"3 victoires 3-0",          cond:"Gagner 3 combats 3-0 contre CPU en mode normal",                     taux:65, cote:1.40 },
  // INTERMÉDIAIRE
  { id:"fz4",  p:"intermediaire",nom:"Sparking Blast KO",        cond:"Conclure un combat avec le Sparking Blast",                          taux:52, cote:1.60 },
  { id:"fz5",  p:"intermediaire",nom:"Victoire sans assist",     cond:"Gagner un combat sans utiliser les assists une seule fois",           taux:45, cote:2.00 },
  { id:"fz6",  p:"intermediaire",nom:"Combo 30+ hits",           cond:"Réaliser un combo de 30 hits minimum",                               taux:42, cote:2.00 },
  { id:"fz7",  p:"intermediaire",nom:"Victoire diff. Hard",      cond:"Gagner en difficulté Hard",                                          taux:48, cote:1.80 },
  // AVANCÉ
  { id:"fz8",  p:"avance",       nom:"Victoire Extrême",         cond:"Terminer le mode Arcade en difficulté Extrême",                      taux:28, cote:3.00 },
  { id:"fz9",  p:"avance",       nom:"Combo 50+ hits",           cond:"Réaliser un combo de 50 hits ou plus en match",                      taux:22, cote:3.50 },
  { id:"fz10", p:"avance",       nom:"3v3 parfait",              cond:"Gagner un combat 3v3 sans perdre aucun personnage",                  taux:25, cote:3.00 },
  // EXPERT
  { id:"fz11", p:"expert",       nom:"10 Arcade Extrême",        cond:"10 victoires Arcade consécutives en Extrême",                        taux:12, cote:6.00 },
  { id:"fz12", p:"expert",       nom:"Combo 100 hits",           cond:"Réaliser un combo de 100 hits en match réel",                        taux:8,  cote:6.00 },
  // LÉGENDAIRE
  { id:"fz13", p:"legendaire",   nom:"Victoire en 1 perso",      cond:"Gagner un 3v3 en Extrême en n'utilisant qu'un seul personnage",      taux:4,  cote:7.00 },
  { id:"fz14", p:"legendaire",   nom:"Perfection Extrême",       cond:"Gagner 3-0 sans perdre un seul personnage en Extrême",              taux:3,  cote:7.00 },
];

// ════════════════════════════════════════════════════════════
// 💀 MORTAL KOMBAT (MK11 / MK1)
// Violence et précision — Fatality, Flawless, Brutality
// ════════════════════════════════════════════════════════════
export const DEFIS_MK: Defi[] = [
  // DÉBUTANT
  { id:"mk1",  p:"debutant",     nom:"Victoire 2-0",             cond:"Gagner un combat 2-0 contre CPU (diff. normale)",                    taux:82, cote:1.10 },
  { id:"mk2",  p:"debutant",     nom:"Fatality réussie",         cond:"Placer une Fatality pour conclure un combat",                        taux:75, cote:1.20 },
  { id:"mk3",  p:"debutant",     nom:"Brutality réussie",        cond:"Conclure un combat avec une Brutality",                              taux:70, cote:1.30 },
  { id:"mk4",  p:"debutant",     nom:"3 victoires consécutives", cond:"Gagner 3 combats de suite en mode Towers",                           taux:68, cote:1.40 },
  // INTERMÉDIAIRE
  { id:"mk5",  p:"intermediaire",nom:"Flawless Victory",         cond:"Gagner un round sans subir aucun dégât (diff. normale)",             taux:55, cote:1.60 },
  { id:"mk6",  p:"intermediaire",nom:"Victoire sans blocage",    cond:"Gagner un combat sans utiliser le blocage une seule fois",           taux:45, cote:2.00 },
  { id:"mk7",  p:"intermediaire",nom:"Victoire diff. Hard",      cond:"Gagner en difficulté Hard",                                          taux:48, cote:1.80 },
  { id:"mk8",  p:"intermediaire",nom:"Combo 20+ hits",           cond:"Réaliser un combo de 20 hits ou plus en match",                      taux:42, cote:2.00 },
  // AVANCÉ
  { id:"mk9",  p:"avance",       nom:"2 Flawless en un match",   cond:"Gagner 2 rounds parfaits dans le même combat (diff. Hard)",          taux:28, cote:3.00 },
  { id:"mk10", p:"avance",       nom:"Victoire Expert",          cond:"Gagner en difficulté Expert",                                        taux:22, cote:3.50 },
  { id:"mk11", p:"avance",       nom:"10 Towers sans défaite",   cond:"Terminer 10 tours en mode Towers sans perdre un seul combat",       taux:25, cote:3.00 },
  // EXPERT
  { id:"mk12", p:"expert",       nom:"Flawless + Fatality",      cond:"Gagner 2 rounds parfaits ET placer une Fatality (diff. Expert)",     taux:12, cote:6.00 },
  { id:"mk13", p:"expert",       nom:"10 victoires Expert",      cond:"10 victoires consécutives en difficulté Expert",                     taux:10, cote:6.00 },
  // LÉGENDAIRE
  { id:"mk14", p:"legendaire",   nom:"Perfection Expert",        cond:"Gagner 3-0 parfait + Fatality en difficulté Expert",                 taux:4,  cote:7.00 },
  { id:"mk15", p:"legendaire",   nom:"Perso maîtrisé",           cond:"20 victoires consécutives avec un seul perso en Expert",            taux:3,  cote:7.00 },
];

// ════════════════════════════════════════════════════════════
// 🥊 UFC (EA Sports UFC 3/4/5)
// Gestion de l'endurance, des takedowns et des soumissions
// ════════════════════════════════════════════════════════════
export const DEFIS_UFC: Defi[] = [
  // DÉBUTANT
  { id:"ufc1",  p:"debutant",     nom:"Victoire par KO",         cond:"Gagner un combat par KO ou TKO (diff. normale)",                     taux:80, cote:1.10 },
  { id:"ufc2",  p:"debutant",     nom:"Victoire par soumission", cond:"Gagner par soumission (diff. normale)",                              taux:75, cote:1.20 },
  { id:"ufc3",  p:"debutant",     nom:"Victoire aux points",     cond:"Gagner 3 rounds aux points sans finir l'adversaire",                 taux:70, cote:1.30 },
  { id:"ufc4",  p:"debutant",     nom:"3 victoires de suite",    cond:"Gagner 3 combats consécutifs dans le même mode",                     taux:68, cote:1.40 },
  // INTERMÉDIAIRE
  { id:"ufc5",  p:"intermediaire",nom:"KO au 1er round",         cond:"Gagner par KO avant la fin du round 1 (diff. normale)",              taux:50, cote:1.80 },
  { id:"ufc6",  p:"intermediaire",nom:"Victoire diff. Hard",     cond:"Gagner un combat en difficulté Hard",                                taux:48, cote:1.80 },
  { id:"ufc7",  p:"intermediaire",nom:"Défense parfaite",        cond:"Gagner sans encaisser de takedown (diff. normale)",                  taux:45, cote:2.00 },
  { id:"ufc8",  p:"intermediaire",nom:"Soumission R1",           cond:"Gagner par soumission avant la fin du round 1",                     taux:40, cote:2.25 },
  // AVANCÉ
  { id:"ufc9",  p:"avance",       nom:"Victoire Expert",         cond:"Gagner en difficulté Expert",                                        taux:28, cote:3.00 },
  { id:"ufc10", p:"avance",       nom:"KO headkick",             cond:"Gagner par KO avec un headkick (à valider en direct)",               taux:22, cote:3.50 },
  { id:"ufc11", p:"avance",       nom:"5 soumissions",           cond:"Gagner 5 combats de suite par soumission",                           taux:20, cote:3.50 },
  // EXPERT
  { id:"ufc12", p:"expert",       nom:"10 victoires Expert",     cond:"10 victoires consécutives en difficulté Expert",                     taux:12, cote:6.00 },
  { id:"ufc13", p:"expert",       nom:"KO R1 en Expert",         cond:"Gagner par KO au round 1 en difficulté Expert",                      taux:10, cote:6.00 },
  // LÉGENDAIRE
  { id:"ufc14", p:"legendaire",   nom:"Perfection Expert",       cond:"Gagner 5 combats par KO au R1 en Expert consécutivement",            taux:4,  cote:7.00 },
  { id:"ufc15", p:"legendaire",   nom:"Champion toutes catégories",cond:"Gagner le mode carrière complet en Expert sans défaite",           taux:3,  cote:7.00 },
];

// ════════════════════════════════════════════════════════════
// 👊 TEKKEN (7 / 8)
// Le jeu le plus technique — wall combos, sidestep, rage art
// ════════════════════════════════════════════════════════════
export const DEFIS_TEKKEN: Defi[] = [
  // DÉBUTANT
  { id:"tk1",  p:"debutant",     nom:"Victoire 2-0",             cond:"Gagner un combat 2-0 contre CPU (diff. normale)",                    taux:82, cote:1.10 },
  { id:"tk2",  p:"debutant",     nom:"Rage Art réussi",          cond:"Placer un Rage Art pour gagner le round",                            taux:75, cote:1.20 },
  { id:"tk3",  p:"debutant",     nom:"Wall Combo réussi",        cond:"Placer un wall combo qui termine le round",                          taux:70, cote:1.30 },
  { id:"tk4",  p:"debutant",     nom:"3 victoires de suite",     cond:"Gagner 3 combats consécutifs en Arcade",                             taux:68, cote:1.40 },
  // INTERMÉDIAIRE
  { id:"tk5",  p:"intermediaire",nom:"Victoire parfaite",        cond:"Gagner un round sans subir aucun dégât (diff. normale)",             taux:52, cote:1.60 },
  { id:"tk6",  p:"intermediaire",nom:"Sans Rage Art",            cond:"Gagner 3 combats sans utiliser le Rage Art",                         taux:48, cote:1.80 },
  { id:"tk7",  p:"intermediaire",nom:"Victoire diff. Hard",      cond:"Gagner en difficulté Hard",                                          taux:45, cote:2.00 },
  { id:"tk8",  p:"intermediaire",nom:"Combo 15+ hits",           cond:"Réaliser un combo de 15 hits ou plus en match",                      taux:42, cote:2.00 },
  // AVANCÉ
  { id:"tk9",  p:"avance",       nom:"Victoire Très Difficile",  cond:"Gagner en difficulté Très Difficile / Very Hard",                    taux:28, cote:3.00 },
  { id:"tk10", p:"avance",       nom:"2 rounds parfaits",        cond:"Gagner 2 rounds parfaits dans le même combat (diff. Hard)",          taux:22, cote:3.50 },
  { id:"tk11", p:"avance",       nom:"Arcade complet",           cond:"Terminer l'Arcade sans perdre un seul round en Hard",               taux:20, cote:3.50 },
  // EXPERT
  { id:"tk12", p:"expert",       nom:"Combo 30+ hits",           cond:"Réaliser un combo de 30 hits en match réel",                         taux:12, cote:6.00 },
  { id:"tk13", p:"expert",       nom:"10 Arcade Très Difficile", cond:"10 victoires Arcade consécutives en Très Difficile",                 taux:10, cote:6.00 },
  // LÉGENDAIRE
  { id:"tk14", p:"legendaire",   nom:"Perfection Hard",          cond:"Terminer l'Arcade 3 fois de suite sans perdre un round en Hard",    taux:4,  cote:7.00 },
  { id:"tk15", p:"legendaire",   nom:"Perso inconnu maîtrisé",   cond:"20 victoires consécutives en Très Difficile avec perso peu utilisé",taux:3,  cote:7.00 },
];

// ════════════════════════════════════════════════════════════
// CATALOGUE GLOBAL — tous les jeux SKILLBET
// ════════════════════════════════════════════════════════════
export const GAMES_EXTENDED = {
  // Jeux déjà existants
  pes:     { label:"PES / eFootball",       short:"PES",     icon:"⚽", color:"#22C55E", accent:"#15803d" },
  fifa:    { label:"FIFA / EA FC",          short:"FIFA",    icon:"⚽", color:"#60A5FA", accent:"#1d4ed8" },
  nba:     { label:"NBA 2K",               short:"NBA",     icon:"🏀", color:"#F97316", accent:"#c2410c" },
  nfs:     { label:"Need for Speed",       short:"NFS",     icon:"🏎️", color:"#FACC15", accent:"#a16207" },
  // Nouveaux jeux
  blur:    { label:"BLUR",                 short:"BLUR",    icon:"🚗", color:"#3B82F6", accent:"#1d4ed8" },
  naruto3: { label:"Naruto Storm 3",       short:"NS3",     icon:"🥷", color:"#F97316", accent:"#c2410c" },
  naruto4: { label:"Naruto Storm 4",       short:"NS4",     icon:"🥷", color:"#EF4444", accent:"#991b1b" },
  fighterz:{ label:"Dragon Ball FighterZ", short:"DBFZ",    icon:"🐉", color:"#FACC15", accent:"#a16207" },
  mk:      { label:"Mortal Kombat",        short:"MK",      icon:"💀", color:"#EF4444", accent:"#7f1d1d" },
  ufc:     { label:"EA Sports UFC",        short:"UFC",     icon:"🥊", color:"#F97316", accent:"#7c2d12" },
  tekken:  { label:"Tekken",               short:"TEKKEN",  icon:"👊", color:"#8B5CF6", accent:"#4c1d95" },
  // Physique
  physique:{ label:"Défis Physiques",      short:"PHYSIQUE",icon:"💪", color:"#FF6B00", accent:"#cc5500" },
};

// Map complète des défis par jeu
import { DEFIS as DEFIS_EXISTING } from './defis';
import { ALL_DEFIS_PHYSIQUES } from './defisPhysiques';

export const ALL_DEFIS: Record<string, Defi[]> = {
  ...DEFIS_EXISTING,
  blur:     DEFIS_BLUR,
  naruto3:  DEFIS_NARUTO3,
  naruto4:  DEFIS_NARUTO4,
  fighterz: DEFIS_FIGHTERZ,
  mk:       DEFIS_MK,
  ufc:      DEFIS_UFC,
  tekken:   DEFIS_TEKKEN,
  physique: ALL_DEFIS_PHYSIQUES,
};

// ════════════════════════════════════════════════════════════
// RÉCAPITULATIF DES COTES PAR PALIER
// ════════════════════════════════════════════════════════════
//
// Débutant      (taux 65-82%) → ×1.10 à ×1.40
// Intermédiaire (taux 40-55%) → ×1.60 à ×2.25
// Avancé        (taux 20-32%) → ×3.00 à ×3.50
// Expert        (taux 8-15%)  → ×4.50 à ×6.00
// Légendaire    (taux 2-5%)   → ×7.00 (cap plateforme)
//
// Jeux de combat = cotes légèrement plus élevées à palier égal
// car la maîtrise technique est plus exigeante que FIFA/PES
// ════════════════════════════════════════════════════════════