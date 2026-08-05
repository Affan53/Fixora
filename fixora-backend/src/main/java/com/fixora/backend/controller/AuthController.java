package com.fixora.backend.controller;

import com.fixora.backend.dto.*;
import com.fixora.backend.entity.Role;
import com.fixora.backend.entity.User;
import com.fixora.backend.repository.UserRepository;
import com.fixora.backend.service.JwtService;
import com.fixora.backend.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final OtpService otpService;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody SendOtpRequest req) {
        otpService.sendOtp(req.phone());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        boolean ok = otpService.verifyOtp(req.phone(), req.otp());
        if (!ok) {
            return ResponseEntity.status(401).body(new ApiError("That code didn't match. Check it and try again."));
        }

        var existing = userRepository.findByPhone(req.phone());

        if (existing.isPresent()) {
            User user = existing.get();
            String requestedRole = "WORKER".equalsIgnoreCase(req.role()) ? "WORKER"
                    : "ADMIN".equalsIgnoreCase(req.role()) ? "ADMIN" : "CUSTOMER";
            if (!user.getRole().name().equals(requestedRole)) {
                String correctTab = user.getRole() == Role.WORKER ? "\"I am a worker\"" : "\"I need a worker\"";
                return ResponseEntity.status(409).body(new ApiError(
                        "This number is already registered as a " + user.getRole().name().toLowerCase()
                                + ". Switch to " + correctTab + " to log in, or use a different number."
                ));
            }
            String token = jwtService.generateToken(user.getId(), user.getRole().name());
            return ResponseEntity.ok(new AuthResponse(token, UserDto.from(user)));
        }

        // Admin accounts are never created through public signup — only
        // someone already promoted to ADMIN directly in the database can
        // log into the admin panel. Anyone else requesting "ADMIN" here
        // just falls through with no account created.
        if ("ADMIN".equalsIgnoreCase(req.role())) {
            return ResponseEntity.status(403).body(new ApiError(
                    "Admin accounts are set up directly by the Fixora team, not through self-signup."
            ));
        }

        Role role = "WORKER".equalsIgnoreCase(req.role()) ? Role.WORKER : Role.CUSTOMER;
        User created = User.builder()
                .phone(req.phone())
                .name(req.name() != null && !req.name().isBlank() ? req.name() : "New User")
                .role(role)
                .verified(role == Role.CUSTOMER) // customers don't need KYC; workers do
                .build();
        User saved = userRepository.save(created);

        String token = jwtService.generateToken(saved.getId(), saved.getRole().name());
        return ResponseEntity.ok(new AuthResponse(token, UserDto.from(saved)));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal Object principal) {
        // principal here is the userId Long set by JwtAuthFilter
        Long userId = (Long) principal;
        return userRepository.findById(userId)
                .map(u -> ResponseEntity.ok(UserDto.from(u)))
                .orElseGet(() -> ResponseEntity.status(404).build());
    }

    /**
     * Called by the app right after it registers for push notifications
     * with FCM, so the backend knows which device to actually push to.
     */
    @PostMapping("/me/fcm-token")
    public ResponseEntity<?> registerFcmToken(@AuthenticationPrincipal Object principal,
                                               @Valid @RequestBody FcmTokenRequest req) {
        Long userId = (Long) principal;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(new ApiError("User not found"));

        user.setFcmToken(req.token());
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }
}
