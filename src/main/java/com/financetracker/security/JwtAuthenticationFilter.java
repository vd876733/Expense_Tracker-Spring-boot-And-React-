package com.financetracker.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

/**
 * JWT Authentication Filter
 * Intercepts HTTP requests, extracts JWT tokens from Authorization header,
 * validates them, and sets up the security context for authenticated users.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private TokenProvider tokenProvider;

    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null) {
            return false;
        }
        // Skip only auth endpoints. Import/transactions endpoints must always pass through this filter.
        return path.startsWith("/api/v1/auth/") || path.startsWith("/api/auth/");
    }

    /**
     * Extract JWT token from Authorization header
     *
     * @param request HttpServletRequest
     * @return JWT token or null if not present
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(bearerToken)) {
            bearerToken = request.getHeader(AUTH_HEADER);
        }

        if (StringUtils.hasText(bearerToken)) {
            String normalized = bearerToken.trim();
            if (normalized.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
                String token = normalized.substring(BEARER_PREFIX.length()).trim();
                return StringUtils.hasText(token) ? token : null;
            }
        }
        return null;
    }

    /**
     * Do Filter Internal - Main filter logic
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = extractTokenFromRequest(request);
            String path = request.getRequestURI();
            
            if (jwt == null) {
                System.out.println("[JWT_FILTER] No JWT found in request. Path: " + path);
            } else {
                System.out.println("[JWT_FILTER] JWT found. Token: " + jwt.substring(0, 20) + "...");
            }

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String username = tokenProvider.getUsernameFromToken(jwt);
                String email = tokenProvider.getEmailFromToken(jwt);  // Extract email from JWT claims
                
                System.out.println("[JWT_FILTER] Token is valid. Username: " + username + ", Email: " + email);

                // Create authentication token
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                new ArrayList<>() // Empty authorities for this example
                        );

                // Store both username and email in details for later retrieval
                java.util.HashMap<String, Object> details = new java.util.HashMap<>();
                details.put("username", username);
                details.put("email", email);
                authentication.setDetails(details);

                // Set authentication in security context
                SecurityContextHolder.getContext().setAuthentication(authentication);
                System.out.println("[JWT_FILTER] Authentication set in SecurityContext. Path: " + path);
            } else if (StringUtils.hasText(jwt)) {
                System.err.println("[JWT_FILTER] Token validation failed for path: " + path);
            }
        } catch (Exception ex) {
            System.err.println("[JWT_FILTER] Exception in doFilterInternal: " + ex.getMessage());
            ex.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }
}
