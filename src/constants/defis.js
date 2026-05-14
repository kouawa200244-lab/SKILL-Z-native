// src/constants/defis.js
const DEFIS_BLUR = [ 
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

const DEFIS_NARUTO3 = [
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

const DEFIS_NARUTO4 = [
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

const DEFIS_FIGHTERZ = [
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

const DEFIS_MK = [
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

const DEFIS_UFC = [
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

const DEFIS_TEKKEN = [
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

export const DEFIS = {
  pes: [
    { id: "p1",  p: "debutant",      nom: "Victoire nette",        cond: "Gagner un match en difficulté 1★",                      taux: 80, cote: 1.10 },
    { id: "p2",  p: "debutant",      nom: "Double buteur",         cond: "Marquer 2+ buts dans un match (diff. 1★)",              taux: 75, cote: 1.20 },
    { id: "p3",  p: "debutant",      nom: "Clean sheet",           cond: "Garder sa cage inviolée (diff. 1★)",                    taux: 70, cote: 1.30 },
    { id: "p4",  p: "debutant",      nom: "Victoire 2-0+",         cond: "Gagner 2-0 ou plus (diff. 2★)",                         taux: 65, cote: 1.40 },
    { id: "p5",  p: "debutant",      nom: "Pénalty réussi",        cond: "Marquer un pénalty en match libre (diff. 2★)",          taux: 78, cote: 1.20 },
    { id: "p6",  p: "intermediaire", nom: "Victoire 3★",           cond: "Gagner un match en difficulté 3★",                     taux: 55, cote: 1.60 },
    { id: "p7",  p: "intermediaire", nom: "Hat-trick",             cond: "3 buts avec le même joueur (diff. 2★)",                taux: 45, cote: 2.00 },
    { id: "p8",  p: "intermediaire", nom: "Coup franc direct",     cond: "Marquer un coup franc tiré directement",               taux: 40, cote: 2.25 },
    { id: "p9",  p: "intermediaire", nom: "Sans dribble skill",    cond: "Gagner sans utiliser de dribble spécial (diff. 3★)",   taux: 50, cote: 1.80 },
    { id: "p10", p: "intermediaire", nom: "But de la tête",        cond: "Marquer uniquement de la tête (diff. 3★)",             taux: 48, cote: 1.80 },
    { id: "p11", p: "avance",        nom: "Victoire Légende",      cond: "Gagner en difficulté 5★ Légende",                      taux: 30, cote: 3.00 },
    { id: "p12", p: "avance",        nom: "Victoire 3-0 (4★)",     cond: "Gagner 3-0 ou plus en difficulté 4★",                 taux: 28, cote: 3.00 },
    { id: "p13", p: "avance",        nom: "Under Dog",             cond: "Gagner avec équipe 2★ contre équipe 4★",              taux: 32, cote: 2.50 },
    { id: "p14", p: "avance",        nom: "But lointain",          cond: "Marquer hors surface (diff. 4★) — validé en direct",  taux: 35, cote: 2.50 },
    { id: "p15", p: "avance",        nom: "5 tirs maximum",        cond: "Gagner en tirant au but 5 fois max (diff. 3★)",        taux: 25, cote: 3.50 },
    { id: "p16", p: "expert",        nom: "Manita Légende",        cond: "Gagner 5-0 ou plus en difficulté 5★",                  taux: 12, cote: 6.00 },
    { id: "p17", p: "expert",        nom: "Double CF",             cond: "Marquer 2 coups francs directs dans le même match",    taux: 10, cote: 6.00 },
    { id: "p18", p: "expert",        nom: "Hat-trick Légende",     cond: "Hat-trick complet en difficulté 5★ Légende",           taux: 15, cote: 6.00 },
    { id: "p19", p: "legendaire",    nom: "Perfection Légende",    cond: "Gagner 5-0 en Légende avec équipe 3★ ou moins",        taux: 5,  cote: 7.00 },
    { id: "p20", p: "legendaire",    nom: "But acrobatique",       cond: "Marquer uniquement par retournée ou ciseau",            taux: 6,  cote: 7.00 },
    { id: "p21", p: "legendaire",    nom: "But du gardien",        cond: "Marquer un but avec le gardien de but",                taux: 7,  cote: 7.00 },
  ],
  fifa: [
    { id: "f1",  p: "debutant",      nom: "Victoire Amateur",     cond: "Gagner en difficulté Amateur",                          taux: 82, cote: 1.10 },
    { id: "f2",  p: "debutant",      nom: "2 buts minimum",       cond: "Marquer 2+ buts (Semi-Pro)",                            taux: 72, cote: 1.30 },
    { id: "f3",  p: "debutant",      nom: "Tir de loin",          cond: "Marquer hors surface (Amateur) — validé en direct",    taux: 60, cote: 1.50 },
    { id: "f4",  p: "debutant",      nom: "Clean sheet SP",       cond: "Gagner sans encaisser (Semi-Pro)",                      taux: 68, cote: 1.40 },
    { id: "f5",  p: "debutant",      nom: "Dribble et but",       cond: "Dribbler 3 joueurs puis marquer (Amateur)",             taux: 65, cote: 1.40 },
    { id: "f6",  p: "intermediaire", nom: "Victoire Pro",         cond: "Gagner en difficulté Professionnelle",                  taux: 52, cote: 1.60 },
    { id: "f7",  p: "intermediaire", nom: "Coup franc direct",    cond: "Marquer sur coup franc direct (Semi-Pro+)",             taux: 38, cote: 2.25 },
    { id: "f8",  p: "intermediaire", nom: "Hat-trick SP",         cond: "Hat-trick avec un seul joueur (Semi-Pro)",              taux: 42, cote: 2.00 },
    { id: "f9",  p: "intermediaire", nom: "Sans sprint",          cond: "Gagner sans utiliser le sprint (Amateur)",              taux: 45, cote: 2.00 },
    { id: "f10", p: "avance",        nom: "Victoire World Class", cond: "Gagner en difficulté World Class",                      taux: 28, cote: 3.00 },
    { id: "f11", p: "avance",        nom: "2 buts hors surface",  cond: "2 buts hors surface dans le match (Pro)",               taux: 22, cote: 3.50 },
    { id: "f12", p: "avance",        nom: "Underdog Monde",       cond: "Gagner avec équipe 2★ en World Class",                 taux: 25, cote: 3.50 },
    { id: "f13", p: "expert",        nom: "Victoire Légende",     cond: "Gagner en difficulté Légende (Ultimate)",               taux: 12, cote: 6.00 },
    { id: "f14", p: "expert",        nom: "5-0 World Class",      cond: "Gagner 5-0 ou plus en World Class",                     taux: 15, cote: 6.00 },
    { id: "f15", p: "legendaire",    nom: "5-0 Légende",          cond: "Gagner 5-0 ou plus en difficulté Légende",              taux: 5,  cote: 7.00 },
    { id: "f16", p: "legendaire",    nom: "3 coups francs",       cond: "Marquer 3 coups francs directs dans le même match",     taux: 3,  cote: 7.00 },
  ],
  nba: [
    { id: "n1",  p: "debutant",      nom: "Victoire Rookie",      cond: "Gagner un match en difficulté Rookie",                  taux: 83, cote: 1.10 },
    { id: "n2",  p: "debutant",      nom: "60 pts équipe",        cond: "Scorer 60+ points en équipe (Rookie)",                 taux: 75, cote: 1.20 },
    { id: "n3",  p: "debutant",      nom: "5 trois-points",       cond: "Réussir 5 tirs à 3 points (Rookie)",                   taux: 68, cote: 1.40 },
    { id: "n4",  p: "debutant",      nom: "20 pts avec la star",  cond: "Faire scorer 20 pts à ta star (Pro)",                  taux: 72, cote: 1.30 },
    { id: "n5",  p: "intermediaire", nom: "Victoire All-Star",    cond: "Gagner en difficulté All-Star",                         taux: 50, cote: 1.80 },
    { id: "n6",  p: "intermediaire", nom: "30 pts un joueur",     cond: "Un joueur marque 30+ points (Pro)",                    taux: 42, cote: 2.00 },
    { id: "n7",  p: "intermediaire", nom: "15 passes équipe",     cond: "15+ passes décisives en équipe (All-Star)",            taux: 45, cote: 2.00 },
    { id: "n8",  p: "avance",        nom: "Victoire Superstar",   cond: "Gagner en difficulté Superstar",                        taux: 28, cote: 3.00 },
    { id: "n9",  p: "avance",        nom: "Triple-double",        cond: "Triple-double avec un joueur (All-Star)",              taux: 25, cote: 3.50 },
    { id: "n10", p: "avance",        nom: "Remontée 15 pts",      cond: "Gagner après avoir été mené de 15 pts (All-Star)",     taux: 22, cote: 3.50 },
    { id: "n11", p: "expert",        nom: "Victoire HOF",         cond: "Gagner en difficulté Hall of Fame",                     taux: 12, cote: 6.00 },
    { id: "n12", p: "expert",        nom: "50 pts un joueur",     cond: "Un joueur marque 50+ points (Superstar)",              taux: 10, cote: 6.00 },
    { id: "n13", p: "legendaire",    nom: "60 pts HOF",           cond: "Un joueur marque 60+ points en HOF",                   taux: 4,  cote: 7.00 },
    { id: "n14", p: "legendaire",    nom: "Triple-double HOF",    cond: "Triple-double ET victoire en difficulté HOF",           taux: 6,  cote: 7.00 },
  ],
  nfs: [
    { id: "s1",  p: "debutant",      nom: "1ère place",           cond: "Finir 1er dans une course (diff. débutant)",           taux: 80, cote: 1.10 },
    { id: "s2",  p: "debutant",      nom: "Course propre",        cond: "Terminer sans aucune collision avec les murs",          taux: 70, cote: 1.30 },
    { id: "s3",  p: "debutant",      nom: "Battre le chrono",     cond: "Battre le temps de référence d'un circuit (normale)",  taux: 65, cote: 1.40 },
    { id: "s4",  p: "debutant",      nom: "Drift basique",        cond: "Enchaîner 3 drifts dans un même virage (mode libre)",  taux: 75, cote: 1.20 },
    { id: "s5",  p: "intermediaire", nom: "Uphill battle",        cond: "Gagner contre des voitures de catégorie supérieure",   taux: 45, cote: 2.00 },
    { id: "s6",  p: "intermediaire", nom: "Sans nitro",           cond: "Finir 1er sans utiliser le nitro (diff. normale)",     taux: 50, cote: 1.80 },
    { id: "s7",  p: "intermediaire", nom: "5 drifts consécutifs", cond: "Enchaîner 5 drifts sans sortie de route",              taux: 48, cote: 1.80 },
    { id: "s8",  p: "avance",        nom: "Victoire diff. max",   cond: "Finir 1er en difficulté maximum",                       taux: 25, cote: 3.50 },
    { id: "s9",  p: "avance",        nom: "Clean race diff. max", cond: "Gagner sans collision ET sans sortie (diff. max)",     taux: 22, cote: 3.50 },
    { id: "s10", p: "avance",        nom: "Véhicule le + faible", cond: "Gagner avec le véhicule le moins puissant",            taux: 25, cote: 3.50 },
    { id: "s11", p: "expert",        nom: "Record absolu",        cond: "Battre un temps imposé parmi les meilleurs du jeu",    taux: 12, cote: 6.00 },
    { id: "s12", p: "expert",        nom: "5 courses imbattu",    cond: "Enchaîner 5 premières places (diff. élevée)",          taux: 18, cote: 4.50 },
    { id: "s13", p: "legendaire",    nom: "10 courses imbattu",   cond: "10 premières places consécutives (diff. max)",          taux: 3,  cote: 7.00 },
    { id: "s14", p: "legendaire",    nom: "Stock et Légende",     cond: "Gagner en diff. max avec véhicule 0 modification",     taux: 4,  cote: 7.00 },
  ],
  physique: [
    { id: "phy1",  p: "debutant",      nom: "10 Pompes",         cond: "Faire 10 pompes en moins de 30 secondes",              taux: 85, cote: 1.10 },
    { id: "phy2",  p: "debutant",      nom: "20 Squats",         cond: "Faire 20 squats en moins de 45 secondes",              taux: 82, cote: 1.15 },
    { id: "phy3",  p: "debutant",      nom: "Planche 30s",       cond: "Tenir la planche 30 secondes sans bouger",             taux: 78, cote: 1.20 },
    { id: "phy4",  p: "intermediaire", nom: "20 Pompes",         cond: "Faire 20 pompes en moins de 45 secondes",              taux: 65, cote: 1.50 },
    { id: "phy5",  p: "intermediaire", nom: "50 Squats",         cond: "Faire 50 squats en moins de 1 minute",                 taux: 60, cote: 1.60 },
    { id: "phy6",  p: "intermediaire", nom: "Planche 1min",      cond: "Tenir la planche 1 minute sans bouger",                taux: 55, cote: 1.70 },
    { id: "phy7",  p: "intermediaire", nom: "30 Abdos",          cond: "Faire 30 abdos en moins de 1 minute",                  taux: 58, cote: 1.65 },
    { id: "phy8",  p: "avance",        nom: "30 Pompes",         cond: "Faire 30 pompes en moins de 1 minute",                 taux: 40, cote: 2.50 },
    { id: "phy9",  p: "avance",        nom: "100 Squats",        cond: "Faire 100 squats en moins de 2 minutes",               taux: 35, cote: 2.80 },
    { id: "phy10", p: "avance",        nom: "Planche 2min",      cond: "Tenir la planche 2 minutes sans bouger",               taux: 30, cote: 3.00 },
    { id: "phy11", p: "expert",        nom: "50 Pompes",         cond: "Faire 50 pompes en moins de 1min30",                   taux: 20, cote: 4.50 },
    { id: "phy12", p: "expert",        nom: "150 Squats",        cond: "Faire 150 squats en moins de 3 minutes",               taux: 18, cote: 5.00 },
    { id: "phy13", p: "expert",        nom: "Planche 3min",      cond: "Tenir la planche 3 minutes sans bouger",               taux: 15, cote: 5.50 },
    { id: "phy14", p: "legendaire",    nom: "100 Pompes",        cond: "Faire 100 pompes en moins de 5 minutes",               taux: 8,  cote: 7.00 },
    { id: "phy15", p: "legendaire",    nom: "300 Squats",        cond: "Faire 300 squats en moins de 10 minutes",              taux: 5,  cote: 7.00 },
    { id: "phy16", p: "legendaire",    nom: "Planche 5min",      cond: "Tenir la planche 5 minutes sans bouger",               taux: 6,  cote: 7.00 },
  ],
   blur:     DEFIS_BLUR,
  naruto3:  DEFIS_NARUTO3,
  naruto4:  DEFIS_NARUTO4,
  fighterz: DEFIS_FIGHTERZ,
  mk:       DEFIS_MK,
  ufc:      DEFIS_UFC,
  tekken:   DEFIS_TEKKEN,
};