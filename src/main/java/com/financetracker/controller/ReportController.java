package com.financetracker.controller;

import com.financetracker.entity.User;
import com.financetracker.repository.UserRepository;
import com.financetracker.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null) {
            throw new RuntimeException("Not authenticated");
        }
        String identifier = "";
        if (authentication.getPrincipal() instanceof UserDetails) {
            identifier = ((UserDetails) authentication.getPrincipal()).getUsername();
        } else if (authentication.getPrincipal() instanceof String) {
            identifier = (String) authentication.getPrincipal();
        }
        
        String finalIdentifier = identifier;
        return userRepository.findByUsername(finalIdentifier)
                .orElseGet(() -> userRepository.findByEmailIgnoreCase(finalIdentifier)
                        .orElseGet(() -> userRepository.findByEmail(finalIdentifier)
                                .orElseThrow(() -> new RuntimeException("User not found: " + finalIdentifier))));
    }

    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        byte[] pdfBytes = reportService.generateReportPdf(startDate, endDate, user.getId());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "report.pdf");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @PostMapping("/send-email")
    public ResponseEntity<?> sendReportEmail(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        reportService.sendReportByEmail(startDate, endDate, user.getEmail(), user.getId());

        return ResponseEntity.ok(Map.of("message", "Report sent successfully to " + user.getEmail()));
    }
}
