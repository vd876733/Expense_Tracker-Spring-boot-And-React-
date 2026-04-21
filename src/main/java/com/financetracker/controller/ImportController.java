package com.financetracker.controller;

import com.financetracker.dto.CsvImportResultDTO;
import com.financetracker.service.ImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Import Controller
 * Handles CSV file uploads and bulk transaction imports
 */
@RestController
@RequestMapping("/api/import")
@CrossOrigin(origins = "http://localhost:3000")
public class ImportController {

    @Autowired
    private ImportService importService;

    /**
     * Import transactions from CSV file
     * 
     * @param file the CSV file to import
     * @return Map with import results
     */
    @PostMapping("/transactions/csv")
    public ResponseEntity<Map<String, Object>> importTransactionsCsv(
            @RequestParam("file") MultipartFile file) {
        
        System.out.println("[IMPORT_CONTROLLER] CSV import request received. File: " + file.getOriginalFilename() + ", Size: " + file.getSize());
        
        // Validate file
        if (file.isEmpty()) {
            System.out.println("[IMPORT_CONTROLLER] ERROR: File is empty");
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "File is empty");
            return ResponseEntity.badRequest().body(response);
        }

        // Validate file type
        String fileName = file.getOriginalFilename();
        if (fileName == null || !fileName.toLowerCase().endsWith(".csv")) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "File must be a CSV file");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        try {
            CsvImportResultDTO result = importService.importTransactionsFromCsv(file);
            Map<String, Object> response = new HashMap<>();
            
            // Check if there are any errors (including authentication errors)
            boolean hasErrors = !result.getErrors().isEmpty();
            boolean success = !hasErrors && result.getFailedRecords() == 0;
            
            response.put("success", success);
            response.put("message", hasErrors && result.getSuccessfulRecords() == 0 ? 
                    result.getErrors().get(0) : "Import completed successfully");
            response.put("totalRecords", result.getTotalRecords());
            response.put("successfulRecords", result.getSuccessfulRecords());
            response.put("failedRecords", result.getFailedRecords());
            response.put("importedTransactionIds", result.getImportedTransactionIds());
            
            if (!result.getErrors().isEmpty()) {
                response.put("errors", result.getErrors());
            }
            
            // Return appropriate status code based on success
            HttpStatus status = success ? HttpStatus.OK : 
                    (hasErrors && result.getSuccessfulRecords() == 0 ? HttpStatus.UNAUTHORIZED : HttpStatus.PARTIAL_CONTENT);
            return ResponseEntity.status(status).body(response);
        } catch (Exception ex) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error processing file: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get example CSV format
     * 
     * @return CSV content as string
     */
    @GetMapping("/transactions/csv-template")
    public ResponseEntity<String> getCsvTemplate() {
        String csvContent = importService.getExampleCsvFormat();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(
                ContentDisposition.attachment()
                        .filename("transaction-template.csv", StandardCharsets.UTF_8)
                        .build()
        );
        headers.set("Content-Type", "text/csv");

        return ResponseEntity.ok()
                .headers(headers)
                .body(csvContent);
    }

    /**
     * Get CSV import instructions
     * 
     * @return Instructions as JSON
     */
    @GetMapping("/transactions/csv-instructions")
    public ResponseEntity<?> getCsvInstructions() {
        return ResponseEntity.ok(new Object() {
            public final String title = "CSV Import Instructions";
            public final String[] supportedDateFormats = {
                    "yyyy-MM-dd (2024-01-15)",
                    "yyyy/MM/dd (2024/01/15)",
                    "MM-dd-yyyy (01-15-2024)",
                    "MM/dd/yyyy (01/15/2024)",
                    "dd-MM-yyyy (15-01-2024)",
                    "dd/MM/yyyy (15/01/2024)"
            };
            public final String[] validCategories = {
                    "Food", "Transport", "Entertainment", "Utilities", "Shopping", "Healthcare", "Other"
            };
            public final String csvFormat = "Date,Description,Category,Amount\n" +
                    "2024-01-15,Grocery Shopping,Food,45.50\n" +
                    "2024-01-16,Taxi to Office,Transport,15.00\n" +
                    "2024-01-17,Movie Tickets,Entertainment,25.00";
            public final String[] requirements = {
                    "First row must be headers: Date,Description,Category,Amount",
                    "Date field supports multiple formats (see supportedDateFormats)",
                    "Category must be one of the valid categories",
                    "Amount must be a positive number",
                    "Description cannot be empty",
                    "File size limit: 10MB"
            };
        });
    }
}
