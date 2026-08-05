package com.fixora.backend.dto;

import com.fixora.backend.entity.User;

public record UserDto(
        Long id,
        String phone,
        String name,
        String email,
        String role,
        String trade,
        boolean verified
) {
    public static UserDto from(User u) {
        return new UserDto(
                u.getId(),
                u.getPhone(),
                u.getName(),
                u.getEmail(),
                u.getRole().name(),
                u.getTrade(),
                Boolean.TRUE.equals(u.getVerified())
        );
    }
}
