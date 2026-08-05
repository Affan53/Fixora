package com.fixora.backend.service;

import com.fixora.backend.dto.BookingDto;
import com.fixora.backend.entity.Booking;
import com.fixora.backend.entity.BookingStatus;
import com.fixora.backend.entity.Role;
import com.fixora.backend.entity.User;
import com.fixora.backend.repository.BookingRepository;
import com.fixora.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final PushNotificationService pushNotificationService;

    public BookingDto create(Long customerId, String category, String description, String language,
                              Integer budget, boolean emergency, Double lat, Double lng) {
        Booking booking = Booking.builder()
                .customerId(customerId)
                .category(category)
                .description(description)
                .language(language)
                .budget(budget)
                .emergency(emergency)
                .customerLat(lat)
                .customerLng(lng)
                .status(BookingStatus.PENDING)
                .build();
        Booking saved = bookingRepository.save(booking);

        BookingDto dto = BookingDto.from(saved);
        // Fan out to every online worker screen watching this trade — first to accept wins
        messagingTemplate.convertAndSend("/topic/workers/" + category, dto);

        // Real push notification — reaches the worker's phone even if the
        // app is closed or the screen is locked, unlike the WebSocket alone.
        List<User> onlineWorkers = userRepository.findByRoleAndTradeAndOnlineTrue(Role.WORKER, category);
        for (User worker : onlineWorkers) {
            pushNotificationService.send(
                    worker.getFcmToken(),
                    "New job request",
                    (emergency ? "URGENT — " : "") + description,
                    Map.of("type", "new_job", "bookingId", String.valueOf(saved.getId()))
            );
        }

        return dto;
    }

    public BookingDto accept(Long bookingId, Long workerId) {
        int updated = bookingRepository.tryAccept(bookingId, workerId);
        if (updated == 0) {
            throw new IllegalStateException("This job was already accepted by someone else.");
        }
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalStateException("Booking not found"));

        User worker = userRepository.findById(workerId).orElse(null);
        BookingDto dto = BookingDto.from(booking, worker != null ? worker.getName() : null);

        messagingTemplate.convertAndSend("/topic/bookings/" + bookingId, dto);

        userRepository.findById(booking.getCustomerId()).ifPresent(customer ->
                pushNotificationService.send(
                        customer.getFcmToken(),
                        "Worker on the way",
                        (worker != null ? worker.getName() : "A worker") + " accepted your booking",
                        Map.of("type", "booking_accepted", "bookingId", String.valueOf(bookingId))
                )
        );

        return dto;
    }

    public BookingDto updateStatus(Long bookingId, Long workerId, BookingStatus status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalStateException("Booking not found"));
        if (!workerId.equals(booking.getWorkerId())) {
            throw new IllegalStateException("This isn't your job.");
        }
        booking.setStatus(status);
        if (status == BookingStatus.COMPLETED) {
            booking.setCompletedAt(Instant.now());
        }
        Booking saved = bookingRepository.save(booking);

        User worker = userRepository.findById(workerId).orElse(null);
        BookingDto dto = BookingDto.from(saved, worker != null ? worker.getName() : null);
        messagingTemplate.convertAndSend("/topic/bookings/" + bookingId, dto);

        String statusLabel = switch (status) {
            case ON_THE_WAY -> "Your worker is on the way";
            case ARRIVED -> "Your worker has arrived";
            case WORKING -> "Work has started";
            case COMPLETED -> "Job completed";
            default -> null;
        };
        if (statusLabel != null) {
            userRepository.findById(booking.getCustomerId()).ifPresent(customer ->
                    pushNotificationService.send(
                            customer.getFcmToken(), statusLabel, "Booking #" + bookingId,
                            Map.of("type", "status_update", "bookingId", String.valueOf(bookingId))
                    )
            );
        }

        return dto;
    }

    public BookingDto updateWorkerLocation(Long bookingId, Long workerId, Double lat, Double lng) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalStateException("Booking not found"));
        if (!workerId.equals(booking.getWorkerId())) {
            throw new IllegalStateException("This isn't your job.");
        }
        booking.setWorkerLat(lat);
        booking.setWorkerLng(lng);
        booking.setWorkerLocationUpdatedAt(Instant.now());
        Booking saved = bookingRepository.save(booking);

        User worker = userRepository.findById(workerId).orElse(null);
        BookingDto dto = BookingDto.from(saved, worker != null ? worker.getName() : null);
        messagingTemplate.convertAndSend("/topic/bookings/" + bookingId, dto);
        return dto;
    }

    public List<BookingDto> myCustomerBookings(Long customerId) {
        return bookingRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream().map(BookingDto::from).toList();
    }

    public List<BookingDto> myWorkerBookings(Long workerId) {
        return bookingRepository.findByWorkerIdOrderByCreatedAtDesc(workerId)
                .stream().map(BookingDto::from).toList();
    }

    public List<BookingDto> availableForCategory(String category) {
        return bookingRepository.findByCategoryAndStatus(category, BookingStatus.PENDING)
                .stream().map(BookingDto::from).toList();
    }

    public BookingDto get(Long bookingId) {
        return BookingDto.from(bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalStateException("Booking not found")));
    }
}
