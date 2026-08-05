package com.fixora.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "bookings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long customerId;

    /** Nullable until a worker accepts. */
    private Long workerId;

    @Column(nullable = false)
    private String category; // slug, e.g. "electrician"

    @Column(columnDefinition = "TEXT")
    private String description;

    private String language;
    private Integer budget;

    @Column(nullable = false)
    private boolean emergency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    // Customer's location at time of booking — fixed for the life of the job
    private Double customerLat;
    private Double customerLng;

    // Worker's most recent GPS ping — updated every ~15-20s while en route
    private Double workerLat;
    private Double workerLng;
    private Instant workerLocationUpdatedAt;

    @Column(updatable = false)
    private Instant createdAt;
    private Instant acceptedAt;
    private Instant completedAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
        if (this.status == null) this.status = BookingStatus.PENDING;
    }
}
