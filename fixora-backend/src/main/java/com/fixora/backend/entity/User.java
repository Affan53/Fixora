package com.fixora.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = "phone"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 15)
    private String phone; // stored as "91XXXXXXXXXX", no plus sign

    private String name;

    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // Worker-only onboarding/KYC fields — null for customers
    private String trade;
    private Boolean verified;
    private String aadhaarNumber;
    private String panNumber;
    private String accountNumber;
    private String ifsc;

    // Worker-only live status — updated when they toggle online and while on a job
    private Boolean online;
    private Double lat;
    private Double lng;

    /** Firebase Cloud Messaging device token — lets us push a real
     * notification to this user's phone even when the app is closed. */
    @Column(length = 512)
    private String fcmToken;

    @Column(updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
        if (this.verified == null) this.verified = false;
        if (this.online == null) this.online = false;
    }
}
