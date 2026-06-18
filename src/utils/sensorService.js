import {
  Accelerometer,
  Gyroscope,
  Pedometer,
} from 'expo-sensors';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK = 'SKILLZ_BACKGROUND_LOCATION';

/* ════════════════════════════════════════
   ACCÉLÉROMÈTRE
   Pompes, Squats, Planche, Sauts
════════════════════════════════════════ */
export class AccelerometerService {
  constructor() {
    this.subscription = null;
    this.data         = { x: 0, y: 0, z: 0 };
    this.history      = [];
    this.MAX_HISTORY  = 50;
  }

  start(onData, intervalMs = 100) {
    Accelerometer.setUpdateInterval(intervalMs);
    this.subscription = Accelerometer.addListener(({ x, y, z }) => {
      this.data = { x, y, z };
      this.history.push({ x, y, z, t: Date.now() });
      if (this.history.length > this.MAX_HISTORY) this.history.shift();
      onData?.({ x, y, z });
    });
  }

  stop() {
    this.subscription?.remove();
    this.subscription = null;
    this.history      = [];
  }

  /* Magnitude du vecteur accélération */
  getMagnitude({ x, y, z } = this.data) {
    return Math.sqrt(x * x + y * y + z * z);
  }
}

/* ════════════════════════════════════════
   GYROSCOPE
   Orientation, rotation, foulée
════════════════════════════════════════ */
export class GyroscopeService {
  constructor() {
    this.subscription = null;
    this.data         = { x: 0, y: 0, z: 0 };
  }

  start(onData, intervalMs = 100) {
    Gyroscope.setUpdateInterval(intervalMs);
    this.subscription = Gyroscope.addListener(({ x, y, z }) => {
      this.data = { x, y, z };
      onData?.({ x, y, z });
    });
  }

  stop() {
    this.subscription?.remove();
    this.subscription = null;
  }
}

/* ════════════════════════════════════════
   PÉDOMÈTRE
   Comptage de pas
════════════════════════════════════════ */
export class PedometerService {
  constructor() {
    this.subscription = null;
    this.steps        = 0;
    this.startSteps   = 0;
    this.available    = false;
  }

  async checkAvailability() {
    this.available = await Pedometer.isAvailableAsync();
    return this.available;
  }

  start(onSteps) {
    this.subscription = Pedometer.watchStepCount(({ steps }) => {
      this.steps = steps;
      onSteps?.(steps);
    });
  }

  async getPastSteps(minutes = 60) {
    const end   = new Date();
    const start = new Date(end.getTime() - minutes * 60 * 1000);
    const result = await Pedometer.getStepCountAsync(start, end);
    return result?.steps || 0;
  }

  stop() {
    this.subscription?.remove();
    this.subscription = null;
  }
}

/* ════════════════════════════════════════
   GPS — Course avec distance
════════════════════════════════════════ */

/* Calculer la distance entre deux points GPS (formule Haversine) */
export function calcDistance(lat1, lon1, lat2, lon2) {
  const R    = 6371000; // rayon Terre en mètres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class GPSService {
  constructor() {
    this.subscription    = null;
    this.positions       = [];
    this.totalDistance   = 0; // en mètres
    this.currentSpeed    = 0; // km/h
    this.lastPosition    = null;
  }

  async requestPermissions() {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') throw new Error('Permission GPS refusée.');

    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    return { foreground: fg === 'granted', background: bg === 'granted' };
  }

  async getCurrentPosition() {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return loc.coords;
  }

  startTracking(onUpdate, intervalMs = 1000) {
    this.subscription = Location.watchPositionAsync(
      {
        accuracy:           Location.Accuracy.BestForNavigation,
        timeInterval:       intervalMs,
        distanceInterval:   2, // update tous les 2 mètres
      },
      (location) => {
        const { latitude, longitude, speed } = location.coords;

        if (this.lastPosition) {
          const delta = calcDistance(
            this.lastPosition.latitude,
            this.lastPosition.longitude,
            latitude,
            longitude
          );
          // Filtrer le bruit GPS (< 1m ou > 50m par tick → invalide)
          if (delta > 1 && delta < 50) {
            this.totalDistance += delta;
          }
        }

        this.lastPosition = { latitude, longitude };
        this.currentSpeed = (speed || 0) * 3.6; // m/s → km/h
        this.positions.push({ latitude, longitude, timestamp: location.timestamp });

        onUpdate?.({
          latitude,
          longitude,
          distanceMeters: Math.round(this.totalDistance),
          distanceKm:     (this.totalDistance / 1000).toFixed(2),
          speedKmh:       this.currentSpeed.toFixed(1),
          positions:      this.positions,
        });
      }
    );
  }

  stopTracking() {
    this.subscription?.then(sub => sub.remove());
    this.subscription = null;
  }

  reset() {
    this.positions     = [];
    this.totalDistance = 0;
    this.lastPosition  = null;
  }
}

/* ════════════════════════════════════════
   DÉTECTEURS DE DÉFIS PHYSIQUES
════════════════════════════════════════ */

/* Détecteur de pompes */
export class PushupDetector {
  constructor() {
    this.count      = 0;
    this.lastState  = 'up'; // 'up' | 'down'
    this.THRESHOLD_DOWN = 0.3; // z < 0.3 → position basse
    this.THRESHOLD_UP   = 0.8; // z > 0.8 → position haute
  }

  /* Analyser l'accélération pour détecter une pompe */
  analyze({ x, y, z }) {
    const detected = false;

    // Téléphone posé → z proche de 1g en haut, proche de 0 en bas
    if (z < this.THRESHOLD_DOWN && this.lastState === 'up') {
      this.lastState = 'down';
    } else if (z > this.THRESHOLD_UP && this.lastState === 'down') {
      this.lastState = 'up';
      this.count++;
      return true; // pompe détectée
    }
    return false;
  }

  reset() {
    this.count     = 0;
    this.lastState = 'up';
  }
}

/* Détecteur de squats */
export class SquatDetector {
  constructor() {
    this.count     = 0;
    this.lastState = 'up';
    // Téléphone dans la poche : accélération verticale (y)
    this.THRESHOLD_DOWN = 0.5;
    this.THRESHOLD_UP   = 0.9;
  }

  analyze({ x, y, z }) {
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    if (magnitude < this.THRESHOLD_DOWN && this.lastState === 'up') {
      this.lastState = 'down';
    } else if (magnitude > this.THRESHOLD_UP && this.lastState === 'down') {
      this.lastState = 'up';
      this.count++;
      return true;
    }
    return false;
  }

  reset() {
    this.count     = 0;
    this.lastState = 'up';
  }
}

/* Détecteur de planche (immobilité) */
export class PlankDetector {
  constructor() {
    this.isHolding   = false;
    this.startTime   = null;
    this.elapsedSecs = 0;
    this.MOTION_THRESHOLD = 0.15; // seuil mouvement autorisé
  }

  analyze({ x, y, z }, previousData) {
    if (!previousData) return { holding: false, seconds: 0 };

    const deltaX = Math.abs(x - previousData.x);
    const deltaY = Math.abs(y - previousData.y);
    const deltaZ = Math.abs(z - previousData.z);
    const motion = deltaX + deltaY + deltaZ;

    if (motion < this.MOTION_THRESHOLD) {
      // En position de planche
      if (!this.isHolding) {
        this.isHolding = true;
        this.startTime = Date.now();
      }
      this.elapsedSecs = Math.floor((Date.now() - this.startTime) / 1000);
    } else {
      // Mouvement détecté → planche interrompue
      this.isHolding = false;
      this.startTime = null;
      this.elapsedSecs = 0;
    }

    return { holding: this.isHolding, seconds: this.elapsedSecs };
  }

  reset() {
    this.isHolding   = false;
    this.startTime   = null;
    this.elapsedSecs = 0;
  }
}