package com.financetracker.controller;

import com.financetracker.dto.AdminAuthRequest;
import com.financetracker.entity.Admin;
import com.financetracker.entity.UserLoginHistory;
import com.financetracker.repository.AdminRepository;
import com.financetracker.repository.UserLoginHistoryRepository;
import com.financetracker.security.TokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private TokenProvider tokenProvider;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private UserLoginHistoryRepository userLoginHistoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostMapping("/auth")
    public ResponseEntity<?> authenticateAdmin(@RequestBody AdminAuthRequest loginRequest, HttpServletRequest request) {
        try {
            Admin admin = adminRepository.findByEmail(loginRequest.getEmail().trim().toLowerCase())
                    .orElseThrow(() -> new RuntimeException("Invalid administrator credentials"));
            
            if (!passwordEncoder.matches(loginRequest.getPassword().trim(), admin.getPassword())) {
                throw new RuntimeException("Invalid administrator credentials");
            }

            String token = tokenProvider.generateAdminToken(admin.getEmail());

            // Set JWT as HttpOnly secure cookie
            ResponseCookie jwtCookie = ResponseCookie.from("admin_jwt", token)
                    .httpOnly(true)
                    .secure(true) // ideally true for production
                    .path("/")
                    .maxAge(7 * 24 * 60 * 60) // 7 days
                    .sameSite("Strict")
                    .build();

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("redirect", "/admin/dashboard");
            responseBody.put("message", "Login successful");
            responseBody.put("token", token);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                    .body(responseBody);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred during authentication.");
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(HttpServletRequest request) {
        // Since we are using cookies now, let's extract it from the cookie.
        String token = null;
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            token = authorizationHeader.substring(7);
        }
        
        if (token == null && request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("admin_jwt".equals(cookie.getName())) {
                    token = cookie.getValue();
                }
            }
        }

        if (token == null || !tokenProvider.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Missing or invalid token.");
        }

        try {
            String email = tokenProvider.getUsernameFromToken(token); // token's subject is email
            Admin admin = adminRepository.findByEmail(email).orElse(null);
            if (admin == null || admin.getRole() == null || 
                (!admin.getRole().equalsIgnoreCase("admin") && 
                 !admin.getRole().equalsIgnoreCase("ROLE_ADMIN") && 
                 !admin.getRole().equalsIgnoreCase("ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin privileges required.");
            }
            
            String sql = "SELECT u.id, u.full_name as name, u.email, u.created_at, h.login_timestamp, h.ip_address " +
                         "FROM users u " +
                         "LEFT JOIN (SELECT user_id, MAX(login_timestamp) as max_ts FROM user_login_history GROUP BY user_id) max_h ON u.id = max_h.user_id " +
                         "LEFT JOIN user_login_history h ON max_h.user_id = h.user_id AND max_h.max_ts = h.login_timestamp " +
                         "ORDER BY u.created_at DESC";

            List<Map<String, Object>> rawUsers = jdbcTemplate.queryForList(sql);
            
            List<Map<String, Object>> formattedUsers = new ArrayList<>();
            for (Map<String, Object> row : rawUsers) {
                Map<String, Object> u = new HashMap<>();
                u.put("id", row.get("id"));
                u.put("name", row.get("name"));
                u.put("email", row.get("email"));
                u.put("createdAt", row.get("created_at"));
                u.put("lastLogin", row.get("login_timestamp"));
                u.put("lastIp", row.get("ip_address"));
                formattedUsers.add(u);
            }

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("totalUsers", formattedUsers.size());
            responseBody.put("users", formattedUsers);

            return ResponseEntity.ok(responseBody);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid or expired token.");
        }
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        // Since we are using cookies now, let's extract it from the cookie.
        // Fallback to Authorization header if needed.
        String token = null;
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("admin_jwt".equals(cookie.getName())) {
                    token = cookie.getValue();
                }
            }
        }
        
        if (token == null) {
            String authorizationHeader = request.getHeader("Authorization");
            if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
                token = authorizationHeader.substring(7);
            }
        }

        if (token == null || !tokenProvider.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Missing or invalid token.");
        }

        try {
            String email = tokenProvider.getUsernameFromToken(token); // token's subject is email
            Admin admin = adminRepository.findByEmail(email).orElse(null);
            if (admin == null || admin.getRole() == null || 
                (!admin.getRole().equalsIgnoreCase("admin") && 
                 !admin.getRole().equalsIgnoreCase("ROLE_ADMIN") && 
                 !admin.getRole().equalsIgnoreCase("ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin privileges required.");
            }
            
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime thirtyMinsAgo = now.minusMinutes(30);
            LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();

            long activeUsers30Min = userLoginHistoryRepository.countActiveUsersSince(thirtyMinsAgo);
            long totalLoginsToday = userLoginHistoryRepository.countLoginsSince(startOfDay);

            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
            org.springframework.data.domain.Page<UserLoginHistory> historyPage = userLoginHistoryRepository.findAllByOrderByLoginTimestampDesc(pageable);

            List<Map<String, Object>> loginHistory = new ArrayList<>();
            for (UserLoginHistory h : historyPage.getContent()) {
                Map<String, Object> record = new HashMap<>();
                record.put("id", h.getId());
                record.put("userId", h.getUser().getId());
                record.put("email", h.getUser().getEmail());
                record.put("name", h.getUser().getFullName());
                record.put("ipAddress", h.getIpAddress());
                record.put("loginTimestamp", h.getLoginTimestamp());
                loginHistory.add(record);
            }

            Map<String, Object> metrics = new HashMap<>();
            metrics.put("activeUsers30Min", activeUsers30Min);
            metrics.put("totalLoginsToday", totalLoginsToday);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("metrics", metrics);
            responseBody.put("loginHistory", loginHistory);
            responseBody.put("totalPages", historyPage.getTotalPages());
            responseBody.put("totalElements", historyPage.getTotalElements());
            responseBody.put("currentPage", historyPage.getNumber());

            return ResponseEntity.ok(responseBody);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid or expired token.");
        }
    }
}
