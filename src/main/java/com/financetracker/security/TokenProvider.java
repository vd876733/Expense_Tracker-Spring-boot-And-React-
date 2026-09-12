package com.financetracker.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Utility class for JWT token generation and validation.
 * Handles the creation and verification of JWT tokens used in authentication.
 */
@Component
public class TokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(TokenProvider.class);

    @Value("${app.jwtSecret:9a2f8c4e1b7d3f6a9c2e5b8a1d4f7c0e3b6a9f2c5d8e1b4a7f0c3e6b9a2f5d8e}")
    private String jwtSecret;

    @Value("${app.jwtExpirationMs:604800000}")
    private long jwtExpirationMs;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(jwtSecret);
        } catch (Exception ex) {
            logger.warn("app.jwtSecret is not Base64 encoded. Falling back to raw UTF-8 bytes.");
            keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        }

        if (keyBytes.length < 32) {
            logger.warn("app.jwtSecret length is less than 32 bytes. Padding key to meet 256-bit requirement.");
            byte[] paddedKey = new byte[32];
            System.arraycopy(keyBytes, 0, paddedKey, 0, Math.min(keyBytes.length, 32));
            keyBytes = paddedKey;
        }

        signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generate a JWT token from Authentication object
     */
    public String generateToken(Authentication authentication) {
        String username = authentication.getName();
        return generateTokenFromUsername(username);
    }

    /**
     * Generate a JWT token from username (Ensures non-null username)
     */
    public String generateTokenFromUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username subject cannot be null or empty for JWT generation");
        }

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Generate a JWT token from username and email (for OAuth2)
     */
    public String generateTokenFromUsernameAndEmail(String username, String email) {
        String subject = (username != null && !username.isBlank()) ? username : email;
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("Subject identifier cannot be null or empty for JWT generation");
        }

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(subject)
                .claim("email", email != null ? email.trim().toLowerCase() : null)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Get username from JWT token
     */
    public String getUsernameFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        return claims.getSubject();
    }

    /**
     * Get email from JWT token claims
     */
    public String getEmailFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        Object emailClaim = claims.get("email");
        return emailClaim != null ? emailClaim.toString() : null;
    }

    /**
     * Get all claims from JWT token
     */
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Validate JWT token
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (MalformedJwtException ex) {
            logger.error("Invalid JWT token", ex);
        } catch (ExpiredJwtException ex) {
            logger.error("Expired JWT token", ex);
        } catch (UnsupportedJwtException ex) {
            logger.error("Unsupported JWT token", ex);
        } catch (IllegalArgumentException ex) {
            logger.error("JWT claims string is empty", ex);
        }
        return false;
    }
}