package com.fixora.backend.repository;

import com.fixora.backend.entity.Role;
import com.fixora.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhone(String phone);
    boolean existsByPhone(String phone);
    java.util.List<User> findByRoleOrderByCreatedAtDesc(Role role);
    long countByRole(Role role);
    java.util.List<User> findByRoleAndTradeAndOnlineTrue(Role role, String trade);
}
