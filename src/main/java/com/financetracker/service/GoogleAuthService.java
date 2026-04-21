package com.financetracker.service;

import com.financetracker.dto.GoogleAuthResponse;
import com.financetracker.entity.User;
import com.financetracker.repository.UserRepository;
import com.financetracker.security.TokenProvider;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for verifying Google ID tokens and mapping them to local users.
 */
@Service
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final TokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final GoogleIdTokenVerifier tokenVerifier;

    public GoogleAuthService(UserRepository userRepository,
                             TokenProvider tokenProvider,
                     PasswordEncoder passwordEncoder,
                     @Value("${app.googleClientId:884510669054-acldripspk9ucf1kp50ad5qlv2l0fv6a.apps.googleusercontent.com}") String googleClientId) {
        this.userRepository = userRepository;
        this.tokenProvider = tokenProvider;
        this.passwordEncoder = passwordEncoder;
        this.tokenVerifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), JacksonFactory.getDefaultInstance())
            .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    public GoogleAuthResponse authenticateWithGoogle(String idToken) throws GeneralSecurityException {
        GoogleIdToken verifiedToken;
        try {
            verifiedToken = tokenVerifier.verify(idToken);
        } catch (Exception ex) {
            throw new GeneralSecurityException("Google ID token verification failed", ex);
        }

        if (verifiedToken == null) {
            throw new GeneralSecurityException("Invalid Google ID token");
        }

        Payload payload = verifiedToken.getPayload();
        String email = payload.getEmail() != null ? payload.getEmail().trim().toLowerCase() : null;
        String fullName = payload.get("name") != null ? payload.get("name").toString() : null;
        String pictureUrl = payload.get("picture") != null ? payload.get("picture").toString() : null;

        if (email == null || email.isBlank()) {
            throw new GeneralSecurityException("Google token missing email");
        }

        User user = upsertUserFromGoogle(email, fullName, pictureUrl);
        String principal = hasText(user.getUsername()) ? user.getUsername() : user.getEmail();
        // FIX: Generate JWT with email claim for authentication context in ImportService
        String jwt = tokenProvider.generateTokenFromUsernameAndEmail(principal, email);

        GoogleAuthResponse.UserProfile profile = new GoogleAuthResponse.UserProfile(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getProfilePictureUrl(),
            user.getLastLoginAt(),
            user.getTotalIncome()
        );

        return new GoogleAuthResponse(jwt, profile);
    }

    private User upsertUserFromGoogle(String email, String fullName, String pictureUrl) {
        // Always check MySQL first to avoid duplicate Google user creation.
        Optional<User> existing = userRepository.findByEmailIgnoreCase(email);
        User user = existing.orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(generateUniqueUsername(email));
            // Assign a temporary UUID-based password so MySQL NOT NULL never fails.
            assignTemporaryPasswordIfMissing(newUser);
            newUser.setTotalIncome(10000.0);
            return newUser;
        });

        if (!hasText(user.getUsername())) {
            user.setUsername(generateUniqueUsername(email));
        }

        assignTemporaryPasswordIfMissing(user);

        if (fullName != null) {
            user.setFullName(fullName);
        }
        if (pictureUrl != null) {
            user.setProfilePictureUrl(pictureUrl);
        }
        user.setLastLoginAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    private void assignTemporaryPasswordIfMissing(User user) {
        if (!hasText(user.getPassword())) {
            user.setPassword(encodeRandomPassword());
        }
    }

    private String encodeRandomPassword() {
        String randomPassword = UUID.randomUUID().toString();
        return passwordEncoder != null ? passwordEncoder.encode(randomPassword) : randomPassword;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String generateUniqueUsername(String email) {
        String base = email.split("@")[0];
        String candidate = base;
        int suffix = 1;

        while (userRepository.existsByUsername(candidate)) {
            candidate = base + suffix;
            suffix += 1;
        }

        return candidate;
    }
}
