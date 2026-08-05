package com.fixora.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FixoraBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(FixoraBackendApplication.class, args);
    }
}
