import { createNavigationContainerRef } from '@react-navigation/native';
import { InteractionManager } from 'react-native';

export const navigationRef = createNavigationContainerRef();

/* ── Navigate immédiat ── */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

/* ── Navigate après interactions (pour les écrans lourds) ── */
export function navigateAfterInteractions(name, params) {
  InteractionManager.runAfterInteractions(() => {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name, params);
    }
  });
}

export function goBack() {
  if (navigationRef.isReady()) {
    navigationRef.goBack();
  }
}

export function reset(state) {
  if (navigationRef.isReady()) {
    navigationRef.reset(state);
  }
}