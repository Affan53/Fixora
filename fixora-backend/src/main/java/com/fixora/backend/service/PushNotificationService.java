package com.fixora.backend.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class PushNotificationService {

    /**
     * Sends a real push notification to one device. Silently no-ops if
     * Firebase isn't configured (local dev without a Firebase project) or
     * the user has no registered device token yet (never opened the app,
     * or denied notification permission).
     */
    public void send(String fcmToken, String title, String body, Map<String, String> data) {
        if (fcmToken == null || fcmToken.isBlank()) return;
        if (FirebaseApp.getApps().isEmpty()) {
            log.debug("Firebase not configured — skipping push: {} / {}", title, body);
            return;
        }
        try {
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                    .putAllData(data != null ? data : Map.of())
                    .build();
            FirebaseMessaging.getInstance().send(message);
        } catch (Exception e) {
            log.warn("Push notification failed for token ending in ...{}: {}",
                    fcmToken.length() > 6 ? fcmToken.substring(fcmToken.length() - 6) : fcmToken, e.getMessage());
        }
    }
}
