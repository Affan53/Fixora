package com.fixora.backend.dto;

public record AdminStatsDto(
        long totalCustomers,
        long totalWorkers,
        long pendingVerifications,
        long todaysBookings,
        long totalBookings
) {}
