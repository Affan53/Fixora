package com.fixora.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record StatusUpdateRequest(
        @NotBlank String status // "ON_THE_WAY" | "ARRIVED" | "WORKING" | "COMPLETED"
) {}
