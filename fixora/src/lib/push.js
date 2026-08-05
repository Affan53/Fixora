import { Capacitor } from "@capacitor/core";
import api from "./api";

/**
 * Registers this device for real push notifications (via FCM) and sends the
 * resulting token to the backend so it can push to this exact phone later —
 * this is what lets a worker get notified about a new job even with the app
 * closed or the screen locked, unlike the in-app WebSocket alone.
 *
 * Only does anything inside the native Android/iOS app — on a regular
 * mobile/desktop browser tab there's no native push channel to register
 * with, so this quietly does nothing there.
 */
export async function registerForPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    let permission = await PushNotifications.checkPermissions();
    if (permission.receive !== "granted") {
      permission = await PushNotifications.requestPermissions();
    }
    if (permission.receive !== "granted") {
      console.warn("Push notification permission denied.");
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener("registration", async (token) => {
      try {
        await api.post("/auth/me/fcm-token", { token: token.value });
      } catch (e) {
        console.error("Couldn't register push token with backend:", e);
      }
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error:", err);
    });

    // Foreground notification tap handling — background taps are handled by
    // the OS itself opening the app; this covers the case where a
    // notification arrives while the app is already open.
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const bookingId = action.notification?.data?.bookingId;
      if (bookingId) {
        window.location.href = `/track/${bookingId}`;
      }
    });
  } catch (e) {
    console.error("Push notification setup failed:", e);
  }
}
