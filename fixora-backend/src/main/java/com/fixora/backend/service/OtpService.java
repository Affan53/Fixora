package com.fixora.backend.service;

import com.fixora.backend.entity.OtpCode;
import com.fixora.backend.repository.OtpCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpCodeRepository otpCodeRepository;
    private final Fast2SmsService fast2SmsService;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int OTP_TTL_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 30;

    public void sendOtp(String phone) {
        // Basic resend throttling so one phone can't be spammed/abused
        otpCodeRepository.findFirstByPhoneAndConsumedFalseOrderByCreatedAtDesc(phone).ifPresent(existing -> {
            if (existing.getCreatedAt().isAfter(Instant.now().minusSeconds(RESEND_COOLDOWN_SECONDS))) {
                throw new IllegalStateException("Please wait a few seconds before requesting another code.");
            }
        });

        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        OtpCode code = OtpCode.builder()
                .phone(phone)
                .codeHash(hash(otp))
                .expiresAt(Instant.now().plus(OTP_TTL_MINUTES, ChronoUnit.MINUTES))
                .attempts(0)
                .consumed(false)
                .build();
        otpCodeRepository.save(code);

        fast2SmsService.sendOtp(phone, otp);
    }

    public boolean verifyOtp(String phone, String otp) {
        OtpCode code = otpCodeRepository.findFirstByPhoneAndConsumedFalseOrderByCreatedAtDesc(phone)
                .orElseThrow(() -> new IllegalStateException("Request a new code first."));

        if (code.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalStateException("That code expired. Request a new one.");
        }
        if (code.getAttempts() >= MAX_ATTEMPTS) {
            throw new IllegalStateException("Too many incorrect attempts. Request a new code.");
        }

        code.setAttempts(code.getAttempts() + 1);

        boolean matches = hash(otp).equals(code.getCodeHash());
        if (matches) {
            code.setConsumed(true);
        }
        otpCodeRepository.save(code);

        return matches;
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(digest.digest(value.getBytes()));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /** Sweeps expired OTP rows once an hour so the table doesn't grow forever. */
    @Scheduled(fixedRate = 60 * 60 * 1000)
    public void cleanupExpired() {
        otpCodeRepository.deleteByExpiresAtBefore(Instant.now().minus(1, ChronoUnit.DAYS));
    }
}
