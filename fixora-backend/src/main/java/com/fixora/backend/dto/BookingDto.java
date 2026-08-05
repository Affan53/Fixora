package com.fixora.backend.dto;

import com.fixora.backend.entity.Booking;

public record BookingDto(
        Long id,
        Long customerId,
        Long workerId,
        String workerName,
        String category,
        String description,
        String language,
        Integer budget,
        boolean emergency,
        String status,
        Double customerLat,
        Double customerLng,
        Double workerLat,
        Double workerLng,
        String createdAt
) {
    public static BookingDto from(Booking b) {
        return from(b, null);
    }

    public static BookingDto from(Booking b, String workerName) {
        return new BookingDto(
                b.getId(),
                b.getCustomerId(),
                b.getWorkerId(),
                workerName,
                b.getCategory(),
                b.getDescription(),
                b.getLanguage(),
                b.getBudget(),
                b.isEmergency(),
                b.getStatus().name(),
                b.getCustomerLat(),
                b.getCustomerLng(),
                b.getWorkerLat(),
                b.getWorkerLng(),
                b.getCreatedAt() != null ? b.getCreatedAt().toString() : null
        );
    }
}
