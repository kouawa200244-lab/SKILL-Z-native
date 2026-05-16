import { createNavigationContainerRef, StackActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/* ── Navigate robuste — attend que le ref soit prêt ── */
export function navigate(name, params) {
  if (!navigationRef.isReady()) {
    // Retry après 100ms si pas encore prêt
    setTimeout(() => navigate(name, params), 100);
    return;
  }
  try {
    navigationRef.navigate(name, params);
  } catch (e) {
    console.warn('[navigationRef] navigate error:', e.message);
  }
}

export function push(name, params) {
  if (!navigationRef.isReady()) {
    setTimeout(() => push(name, params), 100);
    return;
  }
  try {
    navigationRef.dispatch(StackActions.push(name, params));
  } catch (e) {
    console.warn('[navigationRef] push error:', e.message);
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function reset(state) {
  if (navigationRef.isReady()) {
    navigationRef.reset(state);
  }
}

export function getCurrentRoute() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute();
  }
  return null;
}