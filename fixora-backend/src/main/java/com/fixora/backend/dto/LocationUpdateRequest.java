package com.fixora.backend.dto;

import jakarta.validation.constraints.NotNull;

public record LocationUpdateRequest(
        @NotNull Double lat,
        @NotNull Double lng
) {}
