package com.financetracker.service;

import com.financetracker.dto.CsvImportResultDTO;
import com.financetracker.dto.CsvTransactionDTO;
import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ImportService {

    private static final Logger log = LoggerFactory.getLogger(ImportService.class);

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    private static final DateTimeFormatter[] DATE_FORMATTERS = {
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd"),
            DateTimeFormatter.ofPattern("MM-dd-yyyy"),
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ISO_LOCAL_DATE
    };

    private static final List<String> VALID_CATEGORIES = List.of(
            "Food", "Transport", "Entertainment", "Utilities", "Shopping", "Healthcare", "Other"
    );

    public CsvImportResultDTO importTransactionsFromCsv(MultipartFile file) {
        List<String> errors = new ArrayList<>();
        List<Long> importedTransactionIds = new ArrayList<>();
        int successfulRecords = 0;
        int totalRecords = 0;

        try {
            // FIX 1: Robust User Resolution for OAuth2/Google
            User currentUser = resolveCurrentAuthenticatedUser();
            if (currentUser == null) {
                errors.add("Authentication Error: Could not find your user profile. Please re-login.");
                return new CsvImportResultDTO(0, 0, 0, errors, importedTransactionIds);
            }

            List<CsvTransactionDTO> csvRecords = parseCsvFile(file);
            totalRecords = csvRecords.size();

            if (totalRecords == 0) {
                errors.add("The CSV file is empty.");
                return new CsvImportResultDTO(0, 0, 0, errors, importedTransactionIds);
            }

            List<Transaction> validTransactions = new ArrayList<>();

            for (int i = 0; i < csvRecords.size(); i++) {
                CsvTransactionDTO csvRecord = csvRecords.get(i);
                try {
                    Transaction transaction = convertCsvToTransaction(csvRecord, i + 2);
                    
                    // Link to authenticated user
                    transaction.setUser(currentUser);
                    transaction.setUserEmail(currentUser.getEmail());

                    validTransactions.add(transaction);
                    successfulRecords++;
                } catch (IllegalArgumentException ex) {
                    // Log the skip/fail but continue processing other rows
                    if (!ex.getMessage().contains("header row")) {
                        errors.add("Row " + (i + 2) + ": " + ex.getMessage());
                    } else {
                        totalRecords--; // Adjust count if we skipped a header
                    }
                }
            }

            if (!validTransactions.isEmpty()) {
                List<Transaction> saved = transactionRepository.saveAll(validTransactions);
                saved.forEach(t -> importedTransactionIds.add(t.getId()));
            }

        } catch (Exception ex) {
            log.error("CSV import failed", ex);
            errors.add("Critical Error: " + ex.getMessage());
        }

        return new CsvImportResultDTO(totalRecords, successfulRecords, totalRecords - successfulRecords, errors, importedTransactionIds);
    }

    private List<CsvTransactionDTO> parseCsvFile(MultipartFile file) throws Exception {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            CsvToBean<CsvTransactionDTO> csvToBean = new CsvToBeanBuilder<CsvTransactionDTO>(reader)
                    .withType(CsvTransactionDTO.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();
            return csvToBean.parse();
        }
    }

    private Transaction convertCsvToTransaction(CsvTransactionDTO csvRecord, int rowNumber) {
        // FIX 2: Skip Header Logic
        if ("Category".equalsIgnoreCase(csvRecord.getCategory()) && "Amount".equalsIgnoreCase(csvRecord.getAmount())) {
            throw new IllegalArgumentException("header row");
        }

        // Description Validation
        if (csvRecord.getDescription() == null || csvRecord.getDescription().isBlank()) {
            throw new IllegalArgumentException("Description is missing");
        }

        // Category Validation (Case-Insensitive)
        String categoryInput = csvRecord.getCategory() != null ? csvRecord.getCategory().trim() : "";
        String normalizedCategory = VALID_CATEGORIES.stream()
                .filter(c -> c.equalsIgnoreCase(categoryInput))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid category: " + categoryInput));

        // Amount Validation
        Double amount;
        try {
            amount = Double.parseDouble(csvRecord.getAmount().replace("$", "").trim());
            if (amount < 0) throw new IllegalArgumentException("Amount cannot be negative");
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid amount: " + csvRecord.getAmount());
        }

        // Date Validation
        LocalDate date = parseDate(csvRecord.getDate());
        if (date == null) throw new IllegalArgumentException("Invalid date: " + csvRecord.getDate());

        Transaction transaction = new Transaction();
        transaction.setDescription(csvRecord.getDescription().trim());
        transaction.setCategory(normalizedCategory);
        transaction.setAmount(amount);
        transaction.setDate(date);
        return transaction;
    }

    private User resolveCurrentAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            log.warn("[CSV_IMPORT_AUTH] No authenticated user found in security context. auth={}", auth);
            return null;
        }

        log.info("[CSV_IMPORT_AUTH] Authentication found. Principal: {}, isAuthenticated: {}, Type: {}", 
                 auth.getName(), auth.isAuthenticated(), auth.getClass().getSimpleName());

        String email = null;

        // FIX: First try to get email from details (JWT claims via JwtAuthenticationFilter)
        Object details = auth.getDetails();
        log.debug("[CSV_IMPORT_AUTH] Checking details object. Type: {}, Value: {}", 
                  details != null ? details.getClass().getSimpleName() : "null", details);
        
        if (details instanceof java.util.Map) {
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> detailsMap = (java.util.Map<String, Object>) details;
            log.debug("[CSV_IMPORT_AUTH] Details is a Map. Keys: {}", detailsMap.keySet());
            
            Object emailFromDetails = detailsMap.get("email");
            if (emailFromDetails != null) {
                email = emailFromDetails.toString().trim().toLowerCase();
                log.info("[CSV_IMPORT_AUTH] SUCCESS: Email extracted from JWT claims: {}", email);
            } else {
                log.warn("[CSV_IMPORT_AUTH] 'email' key not found in details map. Available keys: {}", detailsMap.keySet());
            }
        } else {
            log.warn("[CSV_IMPORT_AUTH] Details is NOT a Map. Type: {}", details != null ? details.getClass().getName() : "null");
        }

        // FIX: Fallback - try OAuth2User attributes (for direct OAuth2 access)
        if (email == null && auth.getPrincipal() instanceof OAuth2User) {
            log.info("[CSV_IMPORT_AUTH] Trying OAuth2User fallback...");
            OAuth2User oauth2User = (OAuth2User) auth.getPrincipal();
            Object emailAttr = oauth2User.getAttribute("email");
            if (emailAttr != null) {
                email = emailAttr.toString().trim().toLowerCase();
                log.info("[CSV_IMPORT_AUTH] SUCCESS: Email extracted from OAuth2User attributes: {}", email);
            } else {
                log.warn("[CSV_IMPORT_AUTH] OAuth2User has no 'email' attribute. Attributes: {}", oauth2User.getAttributes().keySet());
            }
        }

        // FIX: Fallback - use principal as email if it looks like an email
        if (email == null) {
            String principal = auth.getName();
            log.info("[CSV_IMPORT_AUTH] Trying principal fallback. Principal: {}", principal);
            if (principal != null && principal.contains("@")) {
                email = principal.trim().toLowerCase();
                log.info("[CSV_IMPORT_AUTH] SUCCESS: Using principal as email: {}", email);
            } else {
                log.warn("[CSV_IMPORT_AUTH] Principal does not look like an email: {}", principal);
            }
        }

        if (email == null) {
            log.error("[CSV_IMPORT_AUTH] FAILED: Could not extract email from authentication.");
            log.error("  - Principal: {}", auth.getName());
            log.error("  - Details Type: {}", auth.getDetails() != null ? auth.getDetails().getClass().getName() : "null");
            log.error("  - Details Value: {}", auth.getDetails());
            log.error("  - Principal Type: {}", auth.getPrincipal().getClass().getName());
            return null;
        }

        log.info("[CSV_IMPORT_AUTH] Resolved email: {}", email);
        
        // Find user by email in database
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            log.error("[CSV_IMPORT_AUTH] FAILED: No user found in database for email: {}", email);
            log.error("  - Please ensure user with this email exists in 'users' table");
        } else {
            log.info("[CSV_IMPORT_AUTH] SUCCESS: User resolved for import: {} (ID: {})", email, user.getId());
        }
        return user;
    }

    private LocalDate parseDate(String dateString) {
        if (dateString == null) return null;
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(dateString.trim(), formatter);
            } catch (Exception ignored) {}
        }
        return null;
    }
    /**
     * Get example CSV format for the frontend
     */
    public String getExampleCsvFormat() {
        return "Date,Description,Category,Amount\n" +
                "2024-01-15,Grocery Shopping,Food,45.50\n" +
                "2024-01-16,Taxi to Office,Transport,15.00\n" +
                "2024-01-17,Movie Tickets,Entertainment,25.00\n" +
                "2024-01-18,Electric Bill,Utilities,80.00\n" +
                "2024-01-19,Clothing,Shopping,120.00";
    }
}