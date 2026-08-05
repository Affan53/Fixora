package com.fixora.backend.controller;

import com.fixora.backend.dto.*;
import com.fixora.backend.entity.Role;
import com.fixora.backend.entity.User;
import com.fixora.backend.repository.BookingRepository;
import com.fixora.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

/**
 * All endpoints here require ROLE_ADMIN — enforced in SecurityConfig via
 * `.requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")`, not just
 * left to the frontend to hide the UI for.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> stats() {
        Instant startOfToday = LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
        long pendingVerifications = userRepository.findByRoleOrderByCreatedAtDesc(Role.WORKER)
                .stream().filter(u -> !Boolean.TRUE.equals(u.getVerified()) && u.getTrade() != null).count();

        return ResponseEntity.ok(new AdminStatsDto(
                userRepository.countByRole(Role.CUSTOMER),
                userRepository.countByRole(Role.WORKER),
                pendingVerifications,
                bookingRepository.countByCreatedAtAfter(startOfToday),
                bookingRepository.count()
        ));
    }

    @GetMapping("/workers")
    public ResponseEntity<List<UserDto>> workers() {
        return ResponseEntity.ok(userRepository.findByRoleOrderByCreatedAtDesc(Role.WORKER)
                .stream().map(UserDto::from).toList());
    }

    @GetMapping("/customers")
    public ResponseEntity<List<UserDto>> customers() {
        return ResponseEntity.ok(userRepository.findByRoleOrderByCreatedAtDesc(Role.CUSTOMER)
                .stream().map(UserDto::from).toList());
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingDto>> bookings() {
        return ResponseEntity.ok(bookingRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(BookingDto::from).toList());
    }

    @PostMapping("/workers/{id}/verify")
    public ResponseEntity<?> verifyWorker(@PathVariable Long id) {
        User worker = userRepository.findById(id).orElse(null);
        if (worker == null || worker.getRole() != Role.WORKER) {
            return ResponseEntity.status(404).body(new ApiError("Worker not found"));
        }
        worker.setVerified(true);
        userRepository.save(worker);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/workers/{id}/reject")
    public ResponseEntity<?> rejectWorker(@PathVariable Long id) {
        User worker = userRepository.findById(id).orElse(null);
        if (worker == null || worker.getRole() != Role.WORKER) {
            return ResponseEntity.status(404).body(new ApiError("Worker not found"));
        }
        // Clears their submitted trade/KYC so they're prompted to re-onboard —
        // a real system would also record a rejection reason to show them.
        worker.setTrade(null);
        worker.setVerified(false);
        userRepository.save(worker);
        return ResponseEntity.ok().build();
    }
}
