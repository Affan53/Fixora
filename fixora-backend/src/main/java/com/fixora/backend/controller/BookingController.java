package com.fixora.backend.controller;

import com.fixora.backend.dto.*;
import com.fixora.backend.entity.BookingStatus;
import com.fixora.backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal Object principal,
                                     @Valid @RequestBody CreateBookingRequest req) {
        Long customerId = (Long) principal;
        var dto = bookingService.create(customerId, req.category(), req.description(), req.language(),
                req.budget(), req.emergency(), req.customerLat(), req.customerLng());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.get(id));
    }

    @GetMapping("/mine")
    public ResponseEntity<?> mine(@AuthenticationPrincipal Object principal) {
        Long userId = (Long) principal;
        return ResponseEntity.ok(bookingService.myCustomerBookings(userId));
    }

    @GetMapping("/worker/mine")
    public ResponseEntity<?> workerMine(@AuthenticationPrincipal Object principal) {
        Long workerId = (Long) principal;
        return ResponseEntity.ok(bookingService.myWorkerBookings(workerId));
    }

    @GetMapping("/available")
    public ResponseEntity<?> available(@RequestParam String category) {
        return ResponseEntity.ok(bookingService.availableForCategory(category));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> accept(@AuthenticationPrincipal Object principal, @PathVariable Long id) {
        Long workerId = (Long) principal;
        return ResponseEntity.ok(bookingService.accept(id, workerId));
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@AuthenticationPrincipal Object principal,
                                           @PathVariable Long id,
                                           @Valid @RequestBody StatusUpdateRequest req) {
        Long workerId = (Long) principal;
        BookingStatus status = BookingStatus.valueOf(req.status());
        return ResponseEntity.ok(bookingService.updateStatus(id, workerId, status));
    }

    @PostMapping("/{id}/location")
    public ResponseEntity<?> updateLocation(@AuthenticationPrincipal Object principal,
                                             @PathVariable Long id,
                                             @Valid @RequestBody LocationUpdateRequest req) {
        Long workerId = (Long) principal;
        return ResponseEntity.ok(bookingService.updateWorkerLocation(id, workerId, req.lat(), req.lng()));
    }
}
