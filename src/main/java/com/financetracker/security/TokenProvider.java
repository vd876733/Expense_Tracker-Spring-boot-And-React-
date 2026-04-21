package com.financetracker.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Utility class for JWT token generation and validation.
 * Handles the creation and verification of JWT tokens used in authentication.
 */
@Component
public class TokenProvider {

    @Value("${app.jwtSecret}")
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
            throw new IllegalStateException("Invalid app.jwtSecret: must be a valid Base64-encoded value", ex);
        }

        if (keyBytes.length < 32) {
            throw new IllegalStateException("Invalid app.jwtSecret: decoded key must be at least 256 bits (32 bytes)");
        }

        signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generate a JWT token from Authentication object
     *
     * @param authentication the Authentication object with user details
     * @return JWT token string
     */
    public String generateToken(Authentication authentication) {
        String username = authentication.getName();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(username)            // Fixed: setSubject instead of subject
                .setIssuedAt(now)               // Fixed: setIssuedAt instead of issuedAt
                .setExpiration(expiryDate)      // Fixed: setExpiration instead of expiration
                .signWith(signingKey)
                .compact();
    }

    /**
     * Generate a JWT token from username
     *
     * @param username the username
     * @return JWT token string
     */
    public String generateTokenFromUsername(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(username)            // Fixed: setSubject instead of subject
                .setIssuedAt(now)               // Fixed: setIssuedAt instead of issuedAt
                .setExpiration(expiryDate)      // Fixed: setExpiration instead of expiration
                .signWith(signingKey)
                .compact();
    }

    /**
     * Get username from JWT token
     *
     * @param token the JWT token
     * @return username from the token
     */
    public String getUsernameFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        return claims.getSubject();
    }

    /**
     * Get all claims from JWT token
     *
     * @param token the JWT token
     * @return Claims object
     */
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder()             // Fixed: Use parserBuilder for modern JJWT
            .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Validate JWT token
     *
     * @param token the JWT token
     * @return true if token is valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()                // Fixed: Use parserBuilder for modern JJWT
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (MalformedJwtException ex) {
            System.err.println("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            System.err.println("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            System.err.println("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            System.err.println("JWT claims string is empty");
        }
        return false;
    }
}