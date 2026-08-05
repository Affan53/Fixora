package com.fixora.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Sends OTP SMS via Fast2SMS's "OTP route" — a pre-approved DLT template
 * that just fills in the numeric code, which is why no message text is
 * configurable here. See README for how to get an API key.
 * Docs: https://docs.fast2sms.com/
 */
@Service
@Slf4j
public class Fast2SmsService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${fast2sms.api-key:}")
    private String apiKey;

    private static final String ENDPOINT = "https://www.fast2sms.com/dev/bulkV2";

    /**
     * @param phone 10-digit Indian mobile number, no country code
     * @param otp   6-digit numeric code to send
     */
    public void sendOtp(String phone, String otp) {
        if (apiKey == null || apiKey.isBlank()) {
            // Lets local dev proceed without a real Fast2SMS account —
            // the OTP is only visible in the backend log, never to the user.
            log.warn("FAST2SMS_API_KEY not set — skipping real SMS. OTP for {} is {}", phone, otp);
            return;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("authorization", apiKey);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("route", "otp");
        form.add("variables_values", otp);
        form.add("numbers", phone);
        form.add("flash", "0");

        String url = UriComponentsBuilder.fromHttpUrl(ENDPOINT).toUriString();
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            log.info("Fast2SMS response for {}: {}", phone, response.getBody());

            // Fast2SMS returns HTTP 200 even for numbers it can't actually
            // deliver to — the real success/failure signal is the "return"
            // field in the JSON body, so we have to check that ourselves.
            if (response.getBody() != null) {
                JsonNode json = objectMapper.readTree(response.getBody());
                boolean success = json.path("return").asBoolean(false);
                if (!success) {
                    String message = json.path("message").isArray() && json.path("message").size() > 0
                            ? json.path("message").get(0).asText()
                            : json.path("message").asText("Fast2SMS couldn't deliver to this number.");
                    log.warn("Fast2SMS rejected {}: {}", phone, message);
                    throw new IllegalStateException(
                            "Couldn't send an SMS to this number (" + message + "). Double-check it's correct."
                    );
                }
            }
        } catch (IllegalStateException e) {
            throw e; // already a clean, user-facing message
        } catch (Exception e) {
            log.error("Fast2SMS send failed for {}: {}", phone, e.getMessage());
            throw new RuntimeException("Couldn't send OTP SMS. Try again shortly.");
        }
    }
}
