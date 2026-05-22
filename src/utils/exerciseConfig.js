// Configuration complète de chaque défi physique
// Joints MoveNet : 0=nez, 5=épaule_g, 6=épaule_d, 7=coude_g, 8=coude_d,
// 9=poignet_g, 10=poignet_d, 11=hanche_g, 12=hanche_d,
// 13=genou_g, 14=genou_d, 15=cheville_g, 16=cheville_d

export const EXERCISE_CONFIGS = {

  /* ══════════ POMPES ══════════ */
  phy1: {
    id: 'phy1', name: 'Pompes', targetReps: 10,
    type: 'reps', cameraFacing: 'front',
    joints: {
      primary:   [5, 7, 9],   // épaule_g → coude_g → poignet_g
      secondary: [6, 8, 10],  // épaule_d → coude_d → poignet_d
    },
    thresholds: { down: 80, up: 155 },
    bodyAngle: { joints: [5, 11, 15], min: 155 }, // corps droit
    feedback: {
      start:   'Mets-toi en position de pompe',
      down:    '⬇️ Descends !',
      up:      '⬆️ Pousse !',
      good:    '✓ Parfait !',
      form:    '⚠️ Garde le corps droit',
      tooFast: '🐢 Ralentis',
    },
    guide: 'Corps droit · Bras largeur épaules · Nez au sol',
    skeleton: 'upper',
  },
  phy4: {
    id: 'phy4', name: '20 Pompes', targetReps: 20,
    type: 'reps', cameraFacing: 'front',
    joints: { primary: [5, 7, 9], secondary: [6, 8, 10] },
    thresholds: { down: 80, up: 155 },
    bodyAngle: { joints: [5, 11, 15], min: 155 },
    feedback: { start: 'Position pompe', down: '⬇️ Descends !', up: '⬆️ Pousse !', good: '✓ Bonne rep !', form: '⚠️ Corps droit', tooFast: '🐢 Ralentis' },
    guide: 'Corps droit · Contrôle le mouvement',
    skeleton: 'upper',
  },
  phy8:  { id: 'phy8',  name: '30 Pompes', targetReps: 30,  type: 'reps', cameraFacing: 'front', joints: { primary: [5, 7, 9], secondary: [6, 8, 10] }, thresholds: { down: 80, up: 155 }, bodyAngle: { joints: [5, 11, 15], min: 155 }, feedback: { start: 'Position pompe', down: '⬇️ Descends !', up: '⬆️ Pousse !', good: '✓ Rep !', form: '⚠️ Corps droit', tooFast: '🐢 Ralentis' }, guide: 'Corps droit · Endurance', skeleton: 'upper' },
  phy11: { id: 'phy11', name: '50 Pompes', targetReps: 50,  type: 'reps', cameraFacing: 'front', joints: { primary: [5, 7, 9], secondary: [6, 8, 10] }, thresholds: { down: 80, up: 155 }, bodyAngle: { joints: [5, 11, 15], min: 155 }, feedback: { start: 'Position pompe', down: '⬇️ Descends !', up: '⬆️ Pousse !', good: '✓ Rep !', form: '⚠️ Corps droit', tooFast: '🐢 Ralentis' }, guide: 'Défi endurance · Corps droit', skeleton: 'upper' },
  phy14: { id: 'phy14', name: '100 Pompes', targetReps: 100, type: 'reps', cameraFacing: 'front', joints: { primary: [5, 7, 9], secondary: [6, 8, 10] }, thresholds: { down: 80, up: 155 }, bodyAngle: { joints: [5, 11, 15], min: 155 }, feedback: { start: 'Position pompe', down: '⬇️ Descends !', up: '⬆️ Pousse !', good: '✓ Rep !', form: '⚠️ Corps droit', tooFast: '🐢 Ralentis' }, guide: 'Défi légendaire · Endurance max', skeleton: 'upper' },

  /* ══════════ SQUATS ══════════ */
  phy2: {
    id: 'phy2', name: 'Squats', targetReps: 20,
    type: 'reps', cameraFacing: 'front',
    joints: {
      primary:   [11, 13, 15], // hanche_g → genou_g → cheville_g
      secondary: [12, 14, 16], // hanche_d → genou_d → cheville_d
    },
    thresholds: { down: 95, up: 160 },
    feedback: {
      start: 'Place-toi de profil',
      down:  '⬇️ Descends !',
      up:    '⬆️ Remonte !',
      good:  '✓ Super squat !',
      form:  '⚠️ Genoux dans l\'axe',
      tooFast: '🐢 Ralentis',
    },
    guide: 'Pieds largeur épaules · Dos droit · Genoux dans l\'axe',
    skeleton: 'lower',
  },
  phy5:  { id: 'phy5',  name: '50 Squats',  targetReps: 50,  type: 'reps', cameraFacing: 'front', joints: { primary: [11, 13, 15], secondary: [12, 14, 16] }, thresholds: { down: 95, up: 160 }, feedback: { start: 'Place-toi de profil', down: '⬇️ Descends !', up: '⬆️ Remonte !', good: '✓ Rep !', form: '⚠️ Dos droit', tooFast: '🐢 Ralentis' }, guide: 'Dos droit · Genoux dans l\'axe', skeleton: 'lower' },
  phy9:  { id: 'phy9',  name: '100 Squats', targetReps: 100, type: 'reps', cameraFacing: 'front', joints: { primary: [11, 13, 15], secondary: [12, 14, 16] }, thresholds: { down: 95, up: 160 }, feedback: { start: 'Position squat', down: '⬇️ Descends !', up: '⬆️ Remonte !', good: '✓ Rep !', form: '⚠️ Dos droit', tooFast: '🐢 Ralentis' }, guide: 'Endurance · Dos droit', skeleton: 'lower' },
  phy12: { id: 'phy12', name: '150 Squats', targetReps: 150, type: 'reps', cameraFacing: 'front', joints: { primary: [11, 13, 15], secondary: [12, 14, 16] }, thresholds: { down: 95, up: 160 }, feedback: { start: 'Position squat', down: '⬇️ Descends !', up: '⬆️ Remonte !', good: '✓ Rep !', form: '⚠️ Dos droit', tooFast: '🐢 Ralentis' }, guide: 'Défi expert · Endurance max', skeleton: 'lower' },
  phy15: { id: 'phy15', name: '300 Squats', targetReps: 300, type: 'reps', cameraFacing: 'front', joints: { primary: [11, 13, 15], secondary: [12, 14, 16] }, thresholds: { down: 95, up: 160 }, feedback: { start: 'Position squat', down: '⬇️ Descends !', up: '⬆️ Remonte !', good: '✓ Rep !', form: '⚠️ Dos droit', tooFast: '🐢 Ralentis' }, guide: 'Défi légendaire · 300 reps !', skeleton: 'lower' },

  /* ══════════ PLANCHE ══════════ */
  phy3: {
    id: 'phy3', name: 'Planche 30s', targetReps: 30,
    type: 'timed', cameraFacing: 'front',
    joints: {
      primary:   [5, 11, 15], // épaule_g → hanche_g → cheville_g
      secondary: [6, 12, 16],
    },
    thresholds: { alignMin: 160, alignMax: 185 }, // angle corps droit
    feedback: {
      start:   'Mets-toi en position planche',
      holding: '💪 Tiens bon !',
      good:    '✓ Belle posture !',
      form:    '⚠️ Rentre le ventre',
      hips:    '⚠️ Hanches trop hautes',
    },
    guide: 'Corps droit · Abdos gainés · Coudes sous épaules',
    skeleton: 'full',
  },
  phy6:  { id: 'phy6',  name: 'Planche 1min',  targetReps: 60,  type: 'timed', cameraFacing: 'front', joints: { primary: [5, 11, 15], secondary: [6, 12, 16] }, thresholds: { alignMin: 160, alignMax: 185 }, feedback: { start: 'Position planche', holding: '💪 Tiens !', good: '✓ Parfait !', form: '⚠️ Corps droit', hips: '⚠️ Hanches basses' }, guide: 'Gainé · Corps droit', skeleton: 'full' },
  phy10: { id: 'phy10', name: 'Planche 2min',  targetReps: 120, type: 'timed', cameraFacing: 'front', joints: { primary: [5, 11, 15], secondary: [6, 12, 16] }, thresholds: { alignMin: 160, alignMax: 185 }, feedback: { start: 'Position planche', holding: '💪 Courage !', good: '✓ Parfait !', form: '⚠️ Corps droit', hips: '⚠️ Hanches' }, guide: '2 minutes · Résiste !', skeleton: 'full' },
  phy13: { id: 'phy13', name: 'Planche 3min',  targetReps: 180, type: 'timed', cameraFacing: 'front', joints: { primary: [5, 11, 15], secondary: [6, 12, 16] }, thresholds: { alignMin: 160, alignMax: 185 }, feedback: { start: 'Position planche', holding: '🔥 3 minutes !', good: '✓ Incroyable !', form: '⚠️ Corps droit', hips: '⚠️ Hanches' }, guide: 'Défi expert · 3 minutes !', skeleton: 'full' },
  phy16: { id: 'phy16', name: 'Planche 5min',  targetReps: 300, type: 'timed', cameraFacing: 'front', joints: { primary: [5, 11, 15], secondary: [6, 12, 16] }, thresholds: { alignMin: 160, alignMax: 185 }, feedback: { start: 'Position planche', holding: '🏆 5 minutes !', good: '✓ Légendaire !', form: '⚠️ Corps droit', hips: '⚠️ Hanches' }, guide: 'Défi légendaire · 5 minutes !', skeleton: 'full' },

  /* ══════════ ABDOS ══════════ */
  phy7: {
    id: 'phy7', name: '30 Abdos', targetReps: 30,
    type: 'reps', cameraFacing: 'front',
    joints: {
      primary:   [5, 11, 13],  // épaule → hanche → genou (angle de flexion)
      secondary: [6, 12, 14],
    },
    thresholds: { down: 140, up: 80 }, // allongé > 140°, contracté < 80°
    feedback: {
      start:   'Allonge-toi sur le dos',
      down:    '⬇️ Descends !',
      up:      '⬆️ Monte !',
      good:    '✓ Bon abdo !',
      form:    '⚠️ Mains derrière la tête',
      tooFast: '🐢 Contrôle',
    },
    guide: 'Mains derrière la tête · Genoux fléchis · Regarder le plafond',
    skeleton: 'full',
  },
};

// Helper : récupère la config par ID de défi
export function getExerciseConfig(defiId) {
  return EXERCISE_CONFIGS[defiId] || null;
}

// Connexions squelette pour le dessin SVG
export const SKELETON_CONNECTIONS = {
  upper: [
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],  // bras
    [5, 11], [6, 12], [11, 12],                  // torse
  ],
  lower: [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // jambes
    [5, 11], [6, 12],                                   // hanches
  ],
  full: [
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
    [5, 11], [6, 12], [11, 12],
    [11, 13], [13, 15], [12, 14], [14, 16],
  ],
};