package com.financetracker.dto;

import java.time.LocalDateTime;

/**
 * Google Authentication Response DTO
 * Returns app JWT and a safe user profile payload.
 */
public class GoogleAuthResponse {
    private String token;
    private UserProfile user;

    public GoogleAuthResponse() {
    }

    public GoogleAuthResponse(String token, UserProfile user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public UserProfile getUser() {
        return user;
    }

    public void setUser(UserProfile user) {
        this.user = user;
    }

    public static class UserProfile {
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private String profilePictureUrl;
        private LocalDateTime lastLoginAt;
        private Double totalIncome;

        public UserProfile() {
        }

        public UserProfile(Long id, String username, String email, String fullName, String profilePictureUrl, LocalDateTime lastLoginAt, Double totalIncome) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.fullName = fullName;
            this.profilePictureUrl = profilePictureUrl;
            this.lastLoginAt = lastLoginAt;
            this.totalIncome = totalIncome;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getProfilePictureUrl() {
            return profilePictureUrl;
        }

        public void setProfilePictureUrl(String profilePictureUrl) {
            this.profilePictureUrl = profilePictureUrl;
        }

        public LocalDateTime getLastLoginAt() {
            return lastLoginAt;
        }

        public void setLastLoginAt(LocalDateTime lastLoginAt) {
            this.lastLoginAt = lastLoginAt;
        }

        public Double getTotalIncome() {
            return totalIncome;
        }

        public void setTotalIncome(Double totalIncome) {
            this.totalIncome = totalIncome;
        }
    }
}
