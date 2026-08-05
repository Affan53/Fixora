package com.fixora.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.io.IOException;

/**
 * Initializes Firebase Admin so the backend can send real push notifications
 * via FCM. Needs a service account key file — see README for how to get one
 * from Firebase Console. Without it, push sending is silently skipped (logged
 * as a warning) so local dev without push still works for everything else.
 */
@Component
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    @PostConstruct
    public void init() {
        if (credentialsPath == null || credentialsPath.isBlank()) {
            log.warn("FIREBASE_CREDENTIALS_PATH not set — push notifications are disabled. " +
                    "See README for how to set up Firebase Cloud Messaging.");
            return;
        }
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(new FileInputStream(credentialsPath)))
                        .build();
                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin initialized — push notifications are live.");
            }
        } catch (IOException e) {
            log.error("Couldn't initialize Firebase Admin (check FIREBASE_CREDENTIALS_PATH): {}", e.getMessage());
        }
    }
}
