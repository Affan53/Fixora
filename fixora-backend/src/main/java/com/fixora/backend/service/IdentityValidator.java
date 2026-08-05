package com.fixora.backend.service;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class IdentityValidator {

    private static final int[][] D = {
            {0,1,2,3,4,5,6,7,8,9},{1,2,3,4,0,6,7,8,9,5},{2,3,4,0,1,7,8,9,5,6},
            {3,4,0,1,2,8,9,5,6,7},{4,0,1,2,3,9,5,6,7,8},{5,9,8,7,6,0,4,3,2,1},
            {6,5,9,8,7,1,0,4,3,2},{7,6,5,9,8,2,1,0,4,3},{8,7,6,5,9,3,2,1,0,4},
            {9,8,7,6,5,4,3,2,1,0}
    };
    private static final int[][] P = {
            {0,1,2,3,4,5,6,7,8,9},{1,5,7,6,2,8,3,0,9,4},{5,8,0,3,7,9,6,1,4,2},
            {8,9,1,6,0,4,3,5,2,7},{9,4,5,3,1,2,6,8,7,0},{4,2,8,6,5,7,3,9,0,1},
            {2,7,9,3,8,0,6,4,1,5},{7,0,4,6,9,1,3,2,5,8}
    };

    private static final Pattern PAN_PATTERN = Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]$");

    /** Verhoeff checksum — the actual algorithm UIDAI uses for Aadhaar check digits. */
    public boolean isValidAadhaar(String number) {
        if (number == null) return false;
        String digits = number.replaceAll("\\D", "");
        if (digits.length() != 12 || digits.startsWith("0") || digits.startsWith("1")) return false;

        int c = 0;
        String reversed = new StringBuilder(digits).reverse().toString();
        for (int i = 0; i < reversed.length(); i++) {
            int digit = Character.getNumericValue(reversed.charAt(i));
            c = D[c][P[i % 8][digit]];
        }
        return c == 0;
    }

    public boolean isValidPan(String pan) {
        if (pan == null) return false;
        return PAN_PATTERN.matcher(pan.toUpperCase()).matches();
    }
}
