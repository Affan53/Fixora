package com.fixora.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class IfscService {

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Real, free, no-auth lookup against actual RBI bank/branch records.
     * Confirms the IFSC code itself is real — does not confirm the account
     * number belongs to the person submitting it (that needs a penny-drop /
     * Fund Account Validation API with business KYC approval).
     */
    public boolean isValidIfsc(String ifsc) {
        if (ifsc == null || !ifsc.matches("^[A-Z]{4}0[A-Z0-9]{6}$")) return false;
        try {
            restTemplate.getForEntity("https://ifsc.razorpay.com/" + ifsc.toUpperCase(), String.class);
            return true;
        } catch (RestClientException e) {
            return false;
        }
    }
}
