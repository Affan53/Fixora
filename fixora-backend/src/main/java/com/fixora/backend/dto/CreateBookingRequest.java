package com.fixora.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateBookingRequest(
        @NotBlank String category,
        @NotBlank String description,
        String language,
        Integer budget,
        boolean emergency,
        @NotNull Double customerLat,
        @NotNull Double customerLng
) {}
