package com.financetracker.service;

import com.financetracker.dto.CsvImportResultDTO;
import com.financetracker.dto.CsvTransactionDTO;
import com.financetracker.entity.Transaction;
import com.financetracker.repository.TransactionRepository;
import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Import Service
 * Handles CSV file parsing and bulk transaction import
 */
@Service
public class ImportService {

    @Autowired
    private TransactionRepository transactionRepository;

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

    /**
     * Import transactions from CSV file
     * * @param file the uploaded CSV file
     * @return CsvImportResultDTO with import results
     */
    public CsvImportResultDTO importTransactionsFromCsv(MultipartFile file) {
        List<String> errors = new ArrayList<>();
        List<Long> importedTransactionIds = new ArrayList<>();
        int successfulRecords = 0;
        int totalRecords = 0;

        try {
            // Parse CSV file
            List<CsvTransactionDTO> csvRecords = parseCsvFile(file);
            totalRecords = csvRecords.size();

            if (totalRecords == 0) {
                errors.add("CSV file is empty or has no valid records");
                return new CsvImportResultDTO(0, 0, 0, errors, importedTransactionIds);
            }

            // Process each record
            for (int i = 0; i < csvRecords.size(); i++) {
                CsvTransactionDTO csvRecord = csvRecords.get(i);
                try {
                    // Validate and convert record
                    Transaction transaction = convertCsvToTransaction(csvRecord, i + 2); // +2 for header and 1-based indexing
                    
                    // Save transaction
                    Transaction savedTransaction = transactionRepository.save(transaction);
                    importedTransactionIds.add(savedTransaction.getId());
                    successfulRecords++;
                    
                } catch (IllegalArgumentException ex) {
                    errors.add("Row " + (i + 2) + ": " + ex.getMessage());
                }
            }

        } catch (Exception ex) {
            errors.add("Error reading CSV file: " + ex.getMessage());
            return new CsvImportResultDTO(totalRecords, successfulRecords, 
                    totalRecords - successfulRecords, errors, importedTransactionIds);
        }

        int failedRecords = totalRecords - successfulRecords;
        return new CsvImportResultDTO(totalRecords, successfulRecords, failedRecords, errors, importedTransactionIds);
    }

    /**
     * Parse CSV file using OpenCSV
     * * @param file the MultipartFile to parse
     * @return List of CsvTransactionDTO objects
     * @throws Exception if parsing fails
     */
    private List<CsvTransactionDTO> parseCsvFile(MultipartFile file) throws Exception {
        InputStream inputStream = file.getInputStream();
        InputStreamReader inputStreamReader = new InputStreamReader(inputStream);
        BufferedReader bufferedReader = new BufferedReader(inputStreamReader);

        // Fixed: Use bufferedReader instead of undefined 'reader'
        // Fixed: Explicitly typed the CsvToBeanBuilder to prevent generic mismatch errors
        CsvToBean<CsvTransactionDTO> csvToBean = new CsvToBeanBuilder<CsvTransactionDTO>(bufferedReader)
                .withType(CsvTransactionDTO.class)
                .withIgnoreLeadingWhiteSpace(true)
                .build();

        return csvToBean.parse();
    }

    /**
     * Convert CSV record to Transaction entity with validation
     * * @param csvRecord the CSV record to convert
     * @param rowNumber the row number (for error messages)
     * @return Transaction entity
     * @throws IllegalArgumentException if validation fails
     */
    private Transaction convertCsvToTransaction(CsvTransactionDTO csvRecord, int rowNumber) 
            throws IllegalArgumentException {
        
        // Validate description
        if (csvRecord.getDescription() == null || csvRecord.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Description is required");
        }

        // Validate category
        String category = csvRecord.getCategory();
        if (category == null || category.trim().isEmpty()) {
            throw new IllegalArgumentException("Category is required");
        }
        
        // Check if category is valid (case-insensitive)
        boolean validCategory = VALID_CATEGORIES.stream()
                .anyMatch(c -> c.equalsIgnoreCase(category));
        if (!validCategory) {
            throw new IllegalArgumentException(
                    "Invalid category: " + category + ". Valid categories: " + 
                    String.join(", ", VALID_CATEGORIES)
            );
        }

        // Validate and parse amount
        Double amount;
        try {
            if (csvRecord.getAmount() == null || csvRecord.getAmount().trim().isEmpty()) {
                throw new IllegalArgumentException("Amount is required");
            }
            amount = Double.parseDouble(csvRecord.getAmount().trim());
            if (amount < 0) {
                throw new IllegalArgumentException("Amount must be positive");
            }
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid amount format: " + csvRecord.getAmount());
        }

        // Validate and parse date
        LocalDate date = parseDate(csvRecord.getDate());
        if (date == null) {
            throw new IllegalArgumentException(
                    "Invalid date format: " + csvRecord.getDate() + 
                    ". Supported formats: yyyy-MM-dd, yyyy/MM/dd, MM-dd-yyyy, MM/dd/yyyy, dd-MM-yyyy, dd/MM/yyyy"
            );
        }

        // Create and return Transaction entity
        Transaction transaction = new Transaction();
        transaction.setDescription(csvRecord.getDescription().trim());
        transaction.setCategory(category.trim());
        transaction.setAmount(amount);
        transaction.setDate(date);

        return transaction;
    }

    /**
     * Parse date string with multiple format support
     * * @param dateString the date string to parse
     * @return LocalDate if successfully parsed, null otherwise
     */
    private LocalDate parseDate(String dateString) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return null;
        }

        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(dateString.trim(), formatter);
            } catch (Exception ex) {
                // Try next formatter
            }
        }

        return null;
    }

    /**
     * Get example CSV format
     * * @return String with example CSV format
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