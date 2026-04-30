// ============================================================
// src/constants/defisPhysiques.ts
// Catalogue complet des défis physiques SKILLBET
// 90 défis — 8 catégories — 5 paliers
// Cotes calculées avec marge plateforme 10%
// Formule : cote = (1 / taux_réussite) × 0.90
// Cap Légendaire : ×7.00
// ============================================================

export const DEFIS_PHYSIQUES = {

  // ── 💪 POMPES ──────────────────────────────────────────────
  pompes: [
    // DÉBUTANT
    { id:"pom1",  p:"debutant",     nom:"10 pompes chrono",        cond:"10 pompes correctes en moins de 30 secondes",                      taux:85, cote:1.10 },
    { id:"pom2",  p:"debutant",     nom:"15 pompes posture",       cond:"15 pompes dos droit, bras complets, aucune pause",                 taux:78, cote:1.20 },
    { id:"pom3",  p:"debutant",     nom:"20 pompes 1 min",         cond:"20 pompes en moins de 60 secondes",                                taux:72, cote:1.30 },
    // INTERMÉDIAIRE
    { id:"pom4",  p:"intermediaire",nom:"30 pompes enchaînées",    cond:"30 pompes sans pause, tempo imposé (2s descente / 1s montée)",     taux:55, cote:1.60 },
    { id:"pom5",  p:"intermediaire",nom:"20 pompes lentes",        cond:"20 pompes à 4 secondes par répétition (descente + montée)",        taux:48, cote:1.80 },
    { id:"pom6",  p:"intermediaire",nom:"40 pompes 2 min",         cond:"40 pompes correctes en moins de 2 minutes",                        taux:42, cote:2.00 },
    // AVANCÉ
    { id:"pom7",  p:"avance",       nom:"50 pompes chrono",        cond:"50 pompes en moins de 2 min 30, posture stricte",                  taux:28, cote:3.00 },
    { id:"pom8",  p:"avance",       nom:"30 pompes diamant",       cond:"30 pompes mains en diamant, poitrine touche le sol à chaque rep",  taux:25, cote:3.50 },
    { id:"pom9",  p:"avance",       nom:"25 pompes claquées",      cond:"25 pompes pliométriques avec claquement de mains dans les airs",   taux:22, cote:3.50 },
    // EXPERT
    { id:"pom10", p:"expert",       nom:"75 pompes enchaînées",    cond:"75 pompes sans pause, aucune décomposition de posture tolérée",    taux:12, cote:6.00 },
    { id:"pom11", p:"expert",       nom:"50 pompes archer",        cond:"50 pompes archer (extension bras alterné) dos parfaitement droit", taux:10, cote:6.00 },
    // LÉGENDAIRE
    { id:"pom12", p:"legendaire",   nom:"100 pompes en 5 min",     cond:"100 pompes correctes en moins de 5 minutes non-stop",              taux:5,  cote:7.00 },
    { id:"pom13", p:"legendaire",   nom:"50 pompes déclinées",     cond:"50 pompes pieds surélevés à 60cm minimum, bras complets",          taux:4,  cote:7.00 },
  ],

  // ── 🦵 SQUATS ──────────────────────────────────────────────
  squats: [
    // DÉBUTANT
    { id:"sqt1",  p:"debutant",     nom:"20 squats posture",       cond:"20 squats cuisses parallèles au sol, genoux dans l'axe des pieds", taux:82, cote:1.10 },
    { id:"sqt2",  p:"debutant",     nom:"30 squats 1 min",         cond:"30 squats en moins de 60 secondes",                                taux:75, cote:1.20 },
    { id:"sqt3",  p:"debutant",     nom:"15 squats sautés",        cond:"15 jump squats avec atterrissage contrôlé en souplesse",           taux:70, cote:1.30 },
    // INTERMÉDIAIRE
    { id:"sqt4",  p:"intermediaire",nom:"50 squats enchaînés",     cond:"50 squats sans pause, profondeur complète vérifiée",               taux:55, cote:1.60 },
    { id:"sqt5",  p:"intermediaire",nom:"30 squats bulgares",      cond:"30 squats bulgares par jambe, pied arrière surélevé",              taux:45, cote:2.00 },
    { id:"sqt6",  p:"intermediaire",nom:"40 squats sautés",        cond:"40 jump squats enchaînés sans pause supérieure à 3 secondes",      taux:40, cote:2.25 },
    // AVANCÉ
    { id:"sqt7",  p:"avance",       nom:"100 squats 3 min",        cond:"100 squats profonds en moins de 3 minutes",                        taux:28, cote:3.00 },
    { id:"sqt8",  p:"avance",       nom:"50 pistol squats",        cond:"50 squats unipodaux (25 par jambe), genou ne touche pas le sol",   taux:20, cote:3.50 },
    // EXPERT
    { id:"sqt9",  p:"expert",       nom:"150 squats 5 min",        cond:"150 squats en moins de 5 minutes, aucune pause supérieure à 5s",  taux:12, cote:6.00 },
    { id:"sqt10", p:"expert",       nom:"30 squats sautés lestés", cond:"30 jump squats avec gilet lesté minimum 5kg",                      taux:10, cote:6.00 },
    // LÉGENDAIRE
    { id:"sqt11", p:"legendaire",   nom:"300 squats en 10 min",    cond:"300 squats complets en moins de 10 minutes non-stop",              taux:4,  cote:7.00 },
    { id:"sqt12", p:"legendaire",   nom:"100 pistol squats",       cond:"100 squats unipodaux (50 par jambe) en moins de 15 minutes",       taux:3,  cote:7.00 },
  ],

  // ── 🧱 PLANCHE ─────────────────────────────────────────────
  planche: [
    // DÉBUTANT
    { id:"pla1",  p:"debutant",     nom:"Planche 30 secondes",     cond:"Tenir la planche 30s, corps aligné, aucun tremblement majeur",     taux:80, cote:1.10 },
    { id:"pla2",  p:"debutant",     nom:"Planche 45 secondes",     cond:"Tenir 45s, hanches ni trop hautes ni trop basses",                 taux:72, cote:1.30 },
    // INTERMÉDIAIRE
    { id:"pla3",  p:"intermediaire",nom:"Planche 1 minute",        cond:"60 secondes exactes, position stricte validée en direct",          taux:55, cote:1.60 },
    { id:"pla4",  p:"intermediaire",nom:"Planche latérale 30s",    cond:"Planche latérale 30 secondes chaque côté, corps aligné",           taux:50, cote:1.80 },
    { id:"pla5",  p:"intermediaire",nom:"Planche dynamique",       cond:"30 touchers d'épaule en planche sans rotation du bassin",          taux:45, cote:2.00 },
    // AVANCÉ
    { id:"pla6",  p:"avance",       nom:"Planche 2 minutes",       cond:"120 secondes non-stop, corps parfaitement aligné du sol à la tête",taux:30, cote:3.00 },
    { id:"pla7",  p:"avance",       nom:"Planche sur poings",      cond:"90 secondes en appui sur les poings fermés, poignets droits",      taux:25, cote:3.50 },
    // EXPERT
    { id:"pla8",  p:"expert",       nom:"Planche 3 minutes",       cond:"180 secondes, contrôle total, arbitre présent en direct",          taux:14, cote:6.00 },
    { id:"pla9",  p:"expert",       nom:"Planche sur un bras",     cond:"Planche sur un bras 20 secondes chaque côté, corps droit",         taux:8,  cote:6.00 },
    // LÉGENDAIRE
    { id:"pla10", p:"legendaire",   nom:"Planche 5 minutes",       cond:"300 secondes d'affilée, position stricte validée du début à fin",  taux:4,  cote:7.00 },
    { id:"pla11", p:"legendaire",   nom:"Planche une main 1 min",  cond:"60 secondes en appui sur une seule main, corps parfaitement droit",taux:2,  cote:7.00 },
  ],

  // ── 🔥 ABDOS ───────────────────────────────────────────────
  abdos: [
    // DÉBUTANT
    { id:"abd1",  p:"debutant",     nom:"20 crunchs propres",      cond:"20 crunchs, lombaires au sol, contrôle du mouvement à chaque rep", taux:83, cote:1.10 },
    { id:"abd2",  p:"debutant",     nom:"30 abdos 1 min",          cond:"30 sit-ups complets en moins de 60 secondes, pieds libres",        taux:75, cote:1.20 },
    // INTERMÉDIAIRE
    { id:"abd3",  p:"intermediaire",nom:"50 abdos enchaînés",      cond:"50 sit-ups sans pause, pieds non retenus",                         taux:52, cote:1.60 },
    { id:"abd4",  p:"intermediaire",nom:"30 leg raises",           cond:"30 relevés de jambes tendues, dos au sol, mouvement contrôlé",     taux:48, cote:1.80 },
    { id:"abd5",  p:"intermediaire",nom:"Windshield wipers x20",   cond:"20 essuie-glaces jambes tendues, dos stable et lombaires collés",  taux:40, cote:2.25 },
    // AVANCÉ
    { id:"abd6",  p:"avance",       nom:"100 abdos 3 min",         cond:"100 sit-ups complets en moins de 3 minutes",                       taux:28, cote:3.00 },
    { id:"abd7",  p:"avance",       nom:"30 dragon flags",         cond:"30 dragon flags, corps rigide, descente et montée contrôlées",     taux:18, cote:3.50 },
    // EXPERT
    { id:"abd8",  p:"expert",       nom:"150 abdos 5 min",         cond:"150 sit-ups en moins de 5 minutes non-stop",                       taux:12, cote:6.00 },
    { id:"abd9",  p:"expert",       nom:"L-sit 20 × 5 secondes",   cond:"20 répétitions de L-sit tenu 5 secondes (parallèles ou sol)",      taux:8,  cote:6.00 },
    // LÉGENDAIRE
    { id:"abd10", p:"legendaire",   nom:"300 abdos 10 min",        cond:"300 sit-ups complets en moins de 10 minutes",                      taux:4,  cote:7.00 },
  ],

  // ── ⚡ BURPEES ──────────────────────────────────────────────
  burpees: [
    // DÉBUTANT
    { id:"bur1",  p:"debutant",     nom:"10 burpees propres",      cond:"10 burpees complets (pompe + saut) en moins de 60 secondes",       taux:78, cote:1.20 },
    { id:"bur2",  p:"debutant",     nom:"15 burpees 90s",          cond:"15 burpees complets en moins de 90 secondes",                      taux:70, cote:1.30 },
    // INTERMÉDIAIRE
    { id:"bur3",  p:"intermediaire",nom:"20 burpees 2 min",        cond:"20 burpees complets en moins de 2 minutes",                        taux:50, cote:1.80 },
    { id:"bur4",  p:"intermediaire",nom:"30 burpees enchaînés",    cond:"30 burpees, mouvement complet, aucune pause supérieure à 5s",      taux:40, cote:2.25 },
    // AVANCÉ
    { id:"bur5",  p:"avance",       nom:"40 burpees 4 min",        cond:"40 burpees en moins de 4 minutes",                                 taux:28, cote:3.00 },
    { id:"bur6",  p:"avance",       nom:"20 burpees claqués",      cond:"20 burpees avec claquement de mains au sommet de chaque saut",     taux:22, cote:3.50 },
    // EXPERT
    { id:"bur7",  p:"expert",       nom:"60 burpees 7 min",        cond:"60 burpees en moins de 7 minutes non-stop",                        taux:12, cote:6.00 },
    { id:"bur8",  p:"expert",       nom:"30 burpees box jump",     cond:"30 burpees avec box jump (50cm minimum) en fin de mouvement",      taux:10, cote:6.00 },
    // LÉGENDAIRE
    { id:"bur9",  p:"legendaire",   nom:"100 burpees 12 min",      cond:"100 burpees complets en moins de 12 minutes",                      taux:4,  cote:7.00 },
    { id:"bur10", p:"legendaire",   nom:"50 burpees lestés",       cond:"50 burpees avec gilet lesté 5kg minimum, mouvement complet",       taux:3,  cote:7.00 },
  ],

  // ── 🏃 SPRINT ──────────────────────────────────────────────
  sprint: [
    // DÉBUTANT
    { id:"spr1",  p:"debutant",     nom:"50m en 9 secondes",       cond:"Parcourir 50 mètres en moins de 9 secondes, chronométrage live",   taux:80, cote:1.10 },
    { id:"spr2",  p:"debutant",     nom:"100m en 16 secondes",     cond:"Parcourir 100 mètres en moins de 16 secondes",                     taux:75, cote:1.20 },
    // INTERMÉDIAIRE
    { id:"spr3",  p:"intermediaire",nom:"100m en 14 secondes",     cond:"Parcourir 100 mètres en moins de 14 secondes",                     taux:50, cote:1.80 },
    { id:"spr4",  p:"intermediaire",nom:"200m en 30 secondes",     cond:"Parcourir 200 mètres en moins de 30 secondes",                     taux:45, cote:2.00 },
    // AVANCÉ
    { id:"spr5",  p:"avance",       nom:"100m en 12 secondes",     cond:"Parcourir 100 mètres en moins de 12 secondes",                     taux:28, cote:3.00 },
    { id:"spr6",  p:"avance",       nom:"400m en 70 secondes",     cond:"Parcourir 400 mètres en moins de 70 secondes",                     taux:22, cote:3.50 },
    // EXPERT
    { id:"spr7",  p:"expert",       nom:"100m en 11 secondes",     cond:"Parcourir 100 mètres en moins de 11 secondes",                     taux:12, cote:6.00 },
    { id:"spr8",  p:"expert",       nom:"10 × 100m en 20 min",     cond:"10 sprints de 100m avec 1 min récup, chaque sprint sous 14s",      taux:10, cote:6.00 },
    // LÉGENDAIRE
    { id:"spr9",  p:"legendaire",   nom:"100m en 10s5",            cond:"Parcourir 100 mètres en moins de 10 secondes et demi",             taux:4,  cote:7.00 },
  ],

  // ── 🦘 SAUT ────────────────────────────────────────────────
  saut: [
    // DÉBUTANT
    { id:"sau1",  p:"debutant",     nom:"10 box jumps 40cm",       cond:"10 sauts sur box 40cm, réception deux pieds à chaque fois",        taux:80, cote:1.10 },
    { id:"sau2",  p:"debutant",     nom:"Saut en longueur 1m80",   cond:"Sauter à 1m80 ou plus sans élan (saut groupé depuis l'arrêt)",     taux:75, cote:1.20 },
    // INTERMÉDIAIRE
    { id:"sau3",  p:"intermediaire",nom:"15 box jumps 60cm",       cond:"15 sauts sur box 60cm enchaînés sans pause",                       taux:50, cote:1.80 },
    { id:"sau4",  p:"intermediaire",nom:"Saut en longueur 2m",     cond:"Sauter à 2 mètres ou plus sans élan",                              taux:45, cote:2.00 },
    // AVANCÉ
    { id:"sau5",  p:"avance",       nom:"20 box jumps 80cm",       cond:"20 sauts sur box 80cm avec réception contrôlée et stable",         taux:28, cote:3.00 },
    { id:"sau6",  p:"avance",       nom:"Saut en longueur 2m50",   cond:"Sauter à 2m50 ou plus sans élan",                                  taux:22, cote:3.50 },
    // EXPERT
    { id:"sau7",  p:"expert",       nom:"10 box jumps 100cm",      cond:"10 sauts sur box 1 mètre, réception deux pieds stable à chaque",   taux:12, cote:6.00 },
    // LÉGENDAIRE
    { id:"sau8",  p:"legendaire",   nom:"Box jump 120cm",          cond:"Sauter et atterrir sur une box de 1 mètre 20 de hauteur",          taux:5,  cote:7.00 },
  ],

  // ── 🛡 GAINAGE ─────────────────────────────────────────────
  gainage: [
    // DÉBUTANT
    { id:"gai1",  p:"debutant",     nom:"Superman 20 reps",        cond:"20 extensions Superman, 2 secondes tenues en position haute",      taux:82, cote:1.10 },
    { id:"gai2",  p:"debutant",     nom:"Bird dog 15 reps",        cond:"15 bird dogs chaque côté, équilibre et contrôle total",            taux:78, cote:1.20 },
    // INTERMÉDIAIRE
    { id:"gai3",  p:"intermediaire",nom:"Dead bug 20 reps",        cond:"20 dead bugs lents, lombaires collés au sol en permanence",        taux:55, cote:1.60 },
    { id:"gai4",  p:"intermediaire",nom:"Gainage dynamique",       cond:"30 montées de genoux en planche, sans rotation du bassin",         taux:48, cote:1.80 },
    // AVANCÉ
    { id:"gai5",  p:"avance",       nom:"L-sit 30 secondes",       cond:"Tenir le L-sit 30 secondes sur parallèles ou sol",                 taux:25, cote:3.50 },
    { id:"gai6",  p:"avance",       nom:"Hollow body 2 min",       cond:"Tenir la position hollow body 2 minutes, lombaires au sol",        taux:22, cote:3.50 },
    // EXPERT
    { id:"gai7",  p:"expert",       nom:"L-sit 60 secondes",       cond:"Tenir le L-sit 60 secondes consécutives sur parallèles",           taux:10, cote:6.00 },
    // LÉGENDAIRE
    { id:"gai8",  p:"legendaire",   nom:"Planche en V 30s",        cond:"Tenir la planche en V (pike) 30 secondes, jambes parfaitement droites", taux:4, cote:7.00 },
  ],
};

// ── VERSION PLATE pour la sélection dans l'app ──────────────
export const ALL_DEFIS_PHYSIQUES = Object.values(DEFIS_PHYSIQUES).flat();

// ── COTES PAR PALIER (référence) ────────────────────────────
// debutant:     ×1.10 → ×1.40  (taux 70-85%)
// intermediaire:×1.60 → ×2.25  (taux 40-55%)
// avance:       ×2.50 → ×3.50  (taux 20-32%)
// expert:       ×4.50 → ×6.00  (taux 8-18%)
// legendaire:   ×7.00 (cap)    (taux 2-5%)