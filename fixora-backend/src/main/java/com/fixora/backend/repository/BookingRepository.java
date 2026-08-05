package com.fixora.backend.repository;

import com.fixora.backend.entity.Booking;
import com.fixora.backend.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Booking> findByWorkerIdOrderByCreatedAtDesc(Long workerId);

    List<Booking> findByCategoryAndStatus(String category, BookingStatus status);

    List<Booking> findAllByOrderByCreatedAtDesc();

    long countByCreatedAtAfter(java.time.Instant instant);

    /**
     * Atomically claims a booking for a worker — this UPDATE only succeeds if
     * the booking is still PENDING, so if two workers tap "Accept" at the
     * same moment, only the first one's query actually changes a row. The
     * second gets 0 rows updated and knows the job is already taken.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Booking b SET b.workerId = :workerId, b.status = 'ACCEPTED', b.acceptedAt = CURRENT_TIMESTAMP " +
           "WHERE b.id = :bookingId AND b.status = 'PENDING'")
    int tryAccept(@Param("bookingId") Long bookingId, @Param("workerId") Long workerId);
}
