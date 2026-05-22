// ══════════════════════════════════════
// COMPTEUR DE RÉPÉTITIONS
// Machine à états + calcul d'angles
// ══════════════════════════════════════

/* ── Calcul d'angle entre 3 points ── */
export function calculateAngle(a, b, c) {
  if (!a || !b || !c) return null;

  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x);

  let angle = Math.abs(radians * (180.0 / Math.PI));
  if (angle > 180.0) angle = 360 - angle;
  return Math.round(angle);
}

/* ── Score de confiance minimum ── */
const MIN_CONFIDENCE = 0.3;

/* ── Extraction des keypoints pertinents ── */
export function extractKeypoints(keypoints, indices) {
  return indices.map(i => {
    const kp = keypoints[i];
    if (!kp || kp.score < MIN_CONFIDENCE) return null;
    return { x: kp.x, y: kp.y, score: kp.score };
  });
}

/* ── Angle moyen entre joints primaires et secondaires ── */
export function getAverageAngle(keypoints, config) {
  const { primary, secondary } = config.joints;

  const [a1, b1, c1] = extractKeypoints(keypoints, primary);
  const [a2, b2, c2] = extractKeypoints(keypoints, secondary);

  const angle1 = calculateAngle(a1, b1, c1);
  const angle2 = calculateAngle(a2, b2, c2);

  if (angle1 !== null && angle2 !== null) return (angle1 + angle2) / 2;
  if (angle1 !== null) return angle1;
  if (angle2 !== null) return angle2;
  return null;
}

/* ══════════════════════════════════════
   MACHINE À ÉTATS — RÉPÉTITIONS
   États : 'unknown' | 'up' | 'down'
   Transition down → up = +1 rep
══════════════════════════════════════ */
export class RepCounterMachine {
  constructor(config) {
    this.config     = config;
    this.state      = 'unknown';
    this.repCount   = 0;
    this.lastRepAt  = 0;
    this.feedback   = config.feedback.start;
    this.formOk     = true;
    this.angleHistory = [];
    this.MIN_REP_INTERVAL = 600; // ms entre 2 reps
  }

  /* ── Traitement pour les exercices en REPS ── */
  processReps(keypoints) {
    const angle = getAverageAngle(keypoints, this.config);
    if (angle === null) {
      return { repCount: this.repCount, state: this.state, feedback: '🔍 Recadre-toi', angle: null };
    }

    const { down, up } = this.config.thresholds;
    const now          = Date.now();
    const prevState    = this.state;

    // Enregistrer l'historique pour détecter la vitesse
    this.angleHistory.push({ angle, time: now });
    if (this.angleHistory.length > 20) this.angleHistory.shift();

    // Détection de l'état
    if (angle < down) {
      this.state    = 'down';
      this.feedback = this.config.feedback.up;  // en bas → feedback "monte"
    } else if (angle > up) {
      this.state    = 'up';
      this.feedback = this.config.feedback.down; // en haut → feedback "descends"
    }

    // Transition DOWN → UP = +1 rep
    if (prevState === 'down' && this.state === 'up') {
      const timeSinceLastRep = now - this.lastRepAt;
      if (timeSinceLastRep > this.MIN_REP_INTERVAL) {
        this.repCount++;
        this.lastRepAt = now;
        this.feedback  = this.config.feedback.good;
      } else {
        this.feedback = this.config.feedback.tooFast || '🐢 Ralentis';
      }
    }

    // Vérification forme (si config bodyAngle)
    if (this.config.bodyAngle) {
      const { joints, min } = this.config.bodyAngle;
      const [a, b, c]       = extractKeypoints(keypoints, joints);
      const bodyAngle        = calculateAngle(a, b, c);
      this.formOk            = bodyAngle !== null ? bodyAngle >= min : true;
      if (!this.formOk) this.feedback = this.config.feedback.form;
    }

    return {
      repCount: this.repCount,
      state:    this.state,
      feedback: this.feedback,
      angle:    Math.round(angle),
      formOk:   this.formOk,
    };
  }

  /* ── Traitement pour la PLANCHE (timed) ── */
  processPlank(keypoints, elapsedSeconds) {
    const { primary, secondary } = this.config.joints;
    const [a1, b1, c1]           = extractKeypoints(keypoints, primary);
    const [a2, b2, c2]           = extractKeypoints(keypoints, secondary);
    const angle1                  = calculateAngle(a1, b1, c1);
    const angle2                  = calculateAngle(a2, b2, c2);
    const avgAngle                = angle1 !== null && angle2 !== null
      ? (angle1 + angle2) / 2
      : angle1 ?? angle2;

    const { alignMin, alignMax } = this.config.thresholds;
    const isAligned              = avgAngle !== null && avgAngle >= alignMin && avgAngle <= alignMax;

    if (isAligned) {
      this.feedback = this.config.feedback.holding;
      this.formOk   = true;
      this.repCount = Math.floor(elapsedSeconds); // secondes tenues = "reps"
    } else if (avgAngle !== null) {
      this.feedback = avgAngle > alignMax
        ? this.config.feedback.hips
        : this.config.feedback.form;
      this.formOk = false;
    } else {
      this.feedback = '🔍 Recadre-toi';
    }

    return {
      repCount: this.repCount,
      state:    isAligned ? 'holding' : 'breaking',
      feedback: this.feedback,
      angle:    avgAngle !== null ? Math.round(avgAngle) : null,
      formOk:   this.formOk,
      timeHeld: elapsedSeconds,
    };
  }

  /* ── Traitement principal ── */
  process(keypoints, elapsedSeconds = 0) {
    if (!keypoints || keypoints.length === 0) {
      return { repCount: this.repCount, state: this.state, feedback: '🔍 Recadre-toi', angle: null };
    }

    if (this.config.type === 'timed') {
      return this.processPlank(keypoints, elapsedSeconds);
    }
    return this.processReps(keypoints);
  }

  reset() {
    this.state        = 'unknown';
    this.repCount     = 0;
    this.lastRepAt    = 0;
    this.angleHistory = [];
    this.feedback     = this.config.feedback.start;
  }
}