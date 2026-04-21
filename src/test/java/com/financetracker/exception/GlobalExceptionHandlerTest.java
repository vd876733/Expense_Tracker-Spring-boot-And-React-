package com.financetracker.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    @Test
    void handleIllegalArgument_returnsBadRequest() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        ResponseEntity<Map<String, String>> response = handler.handleIllegalArgument(
                new IllegalArgumentException("Transaction amount must be non-negative")
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Transaction amount must be non-negative", response.getBody().get("error"));
    }
}
