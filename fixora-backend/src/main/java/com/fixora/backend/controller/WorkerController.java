package com.fixora.backend.controller;

import com.fixora.backend.dto.ApiError;
import com.fixora.backend.dto.OnlineStatusRequest;
import com.fixora.backend.entity.User;
import com.fixora.backend.repository.UserRepository;
import com.fixora.backend.service.IdentityValidator;
import com.fixora.backend.service.IfscService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workers")
@RequiredArgsConstructor
public class WorkerController {

    private final UserRepository userRepository;
    private final IdentityValidator identityValidator;
    private final IfscService ifscService;

    @PostMapping("/me/status")
    public ResponseEntity<?> setOnline(@AuthenticationPrincipal Object principal,
                                        @Valid @RequestBody OnlineStatusRequest req) {
        Long userId = (Long) principal;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(new ApiError("User not found"));

        user.setOnline(req.online());
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    /**
     * Saves worker onboarding details with REAL validation:
     * - Aadhaar number checked against the actual Verhoeff checksum UIDAI uses
     * - PAN checked against the official format rule
     * - IFSC checked live against real RBI bank/branch records
     *
     * What this does NOT do (and can't, without a licensed/paid KYC API):
     * confirm the Aadhaar/PAN are registered to this specific person, or that
     * the bank account number is real — those need UIDAI-licensed verification
     * and a penny-drop/Fund Account Validation API respectively. See README.
     *
     * Document files (Aadhaar/PAN/photo) aren't persisted to storage yet —
     * that needs Cloudinary wired in, which isn't built yet.
     */
    @PostMapping(value = "/onboarding", consumes = "multipart/form-data")
    public ResponseEntity<?> onboarding(@AuthenticationPrincipal Object principal,
                                        @RequestParam("trade") String trade,
                                        @RequestParam("aadhaarNumber") String aadhaarNumber,
                                        @RequestParam("panNumber") String panNumber,
                                        @RequestParam("accountNumber") String accountNumber,
                                        @RequestParam("ifsc") String ifsc) {
        Long userId = (Long) principal;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(new ApiError("User not found"));

        if (!identityValidator.isValidAadhaar(aadhaarNumber)) {
            return ResponseEntity.status(400).body(new ApiError("That Aadhaar number doesn't check out — check for typos."));
        }
        if (!identityValidator.isValidPan(panNumber)) {
            return ResponseEntity.status(400).body(new ApiError("That PAN isn't a valid format (e.g. ABCDE1234F)."));
        }
        if (!ifscService.isValidIfsc(ifsc)) {
            return ResponseEntity.status(400).body(new ApiError("That IFSC code isn't a real bank branch code."));
        }
        if (accountNumber == null || !accountNumber.matches("^\\d{9,18}$")) {
            return ResponseEntity.status(400).body(new ApiError("Enter a valid 9-18 digit account number."));
        }

        user.setTrade(trade);
        user.setAadhaarNumber(aadhaarNumber);
        user.setPanNumber(panNumber.toUpperCase());
        user.setAccountNumber(accountNumber);
        user.setIfsc(ifsc.toUpperCase());
        // Documents aren't actually reviewed by a human yet — leave `verified`
        // false so the dashboard can show a "pending verification" state honestly.
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }
}
