import { Capacitor } from "@capacitor/core";

/**
 * Returns a single current position as { latitude, longitude }. Uses the
 * native Geolocation plugin inside the app (properly requests Android's
 * runtime location permission), falls back to the browser API on the
 * regular website.
 */
export async function getCurrentPosition() {
  if (Capacitor.isNativePlatform()) {
    const { Geolocation } = await import("@capacitor/geolocation");
    const permission = await Geolocation.checkPermissions();
    if (permission.location !== "granted") {
      const req = await Geolocation.requestPermissions();
      if (req.location !== "granted") {
        throw new Error("Location permission was denied.");
      }
    }
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("This browser doesn't support location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      reject,
      { timeout: 10000 }
    );
  });
}

/**
 * Watches position continuously, calling onUpdate with { latitude, longitude }
 * each time it changes. Returns a function to stop watching.
 *
 * Note on background tracking: this keeps updating reliably while the app is
 * open/foregrounded, same as the browser Geolocation API. True background
 * tracking (screen off, app minimized) needs a foreground-service plugin
 * (e.g. @capacitor-community/background-geolocation) — that's a further step
 * beyond what's wired in here, since it needs its own careful native
 * permission setup (ACCESS_BACKGROUND_LOCATION, a persistent notification)
 * that's worth doing deliberately rather than bundled in blind.
 */
export async function watchPosition(onUpdate) {
  if (Capacitor.isNativePlatform()) {
    const { Geolocation } = await import("@capacitor/geolocation");
    const watchId = await Geolocation.watchPosition({ enableHighAccuracy: true }, (pos, err) => {
      if (err || !pos) return;
      onUpdate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    });
    return () => Geolocation.clearWatch({ id: watchId });
  }

  const id = navigator.geolocation.watchPosition(
    (pos) => onUpdate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    () => {},
    { enableHighAccuracy: true }
  );
  return () => navigator.geolocation.clearWatch(id);
}
