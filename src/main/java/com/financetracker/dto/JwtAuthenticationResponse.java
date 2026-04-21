package com.financetracker.dto;

/**
 * JWT Authentication Response DTO
 * Returns the JWT token to the client
 */
public class JwtAuthenticationResponse {
    private String token;
    private Long userId;

    public JwtAuthenticationResponse() {
    }

    public JwtAuthenticationResponse(String token) {
        this.token = token;
    }

    public JwtAuthenticationResponse(String token, Long userId) {
        this.token = token;
        this.userId = userId;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
