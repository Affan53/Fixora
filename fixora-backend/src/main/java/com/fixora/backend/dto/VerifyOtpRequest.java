package com.fixora.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyOtpRequest(
        @NotBlank
        @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number")
        String phone,

        @NotBlank
        @Pattern(regexp = "^\\d{6}$", message = "Enter the 6-digit code")
        String otp,

        // "CUSTOMER" or "WORKER" — only used the first time this phone number logs in
        String role,

        String name
) {}
