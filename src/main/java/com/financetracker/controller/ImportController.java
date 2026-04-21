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
     * @return CsvImportResultDTO with import results
     */
    @PostMapping("/transactions/csv")
    public ResponseEntity<CsvImportResultDTO> importTransactionsCsv(
            @RequestParam("file") MultipartFile file) {
        
        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // Validate file type
        String fileName = file.getOriginalFilename();
        if (fileName == null || !fileName.toLowerCase().endsWith(".csv")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new CsvImportResultDTO(0, 0, 0, 
                            List.of("File must be a CSV file"), 
                            List.of()));
        }

        try {
            CsvImportResultDTO result = importService.importTransactionsFromCsv(file);
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new CsvImportResultDTO(0, 0, 0, 
                            List.of("Error processing file: " + ex.getMessage()), 
                            List.of()));
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
