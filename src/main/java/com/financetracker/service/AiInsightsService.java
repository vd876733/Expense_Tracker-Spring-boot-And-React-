package com.financetracker.service;

import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AiInsightsService {

    private static final Logger log = LoggerFactory.getLogger(AiInsightsService.class);

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    public AiInsightsService(TransactionRepository transactionRepository,
                           UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Get AI-powered financial insights based on current month spending by category
     * @param email the user's email
     * @return AI-generated insights as a string
     */
    public String getAiCoachInsights(String email) {
        try {
            // Validate API key
            if (geminiApiKey == null || geminiApiKey.isBlank()) {
                return "❌ AI Coach is not configured. Please set your Gemini API key to enable insights.";
            }

            // Find user
            Optional<User> userOptional = userRepository.findByEmail(email);
            if (userOptional.isEmpty()) {
                return "❌ User not found.";
            }

            // Get current month and year
            YearMonth currentMonth = YearMonth.now();
            int month = currentMonth.getMonthValue();
            int year = currentMonth.getYear();

            // Fetch transactions for current month
            List<Transaction> monthlyTransactions = transactionRepository
                    .findByMonthAndYearAndUser_Email(month, year, email);

            if (monthlyTransactions == null || monthlyTransactions.isEmpty()) {
                return "📊 No transactions found for this month yet. Add some expenses to get personalized AI insights!";
            }

            // Build spending breakdown by category
            Map<String, Double> categorySpending = buildCategorySpending(monthlyTransactions);

            // Generate prompt
            String prompt = generateFinancialPrompt(categorySpending, userOptional.get());

            // Call Gemini API and return response
            return callGeminiApi(prompt);

        } catch (Exception e) {
            log.error("Error generating AI insights", e);
            return "❌ Error generating insights: " + e.getMessage();
        }
    }

    /**
     * Build a map of category spending from transactions
     * @param transactions list of transactions
     * @return map of category -> total spending
     */
    private Map<String, Double> buildCategorySpending(List<Transaction> transactions) {
        return transactions.stream()
                .collect(Collectors.groupingBy(
                        Transaction::getCategory,
                        Collectors.summingDouble(Transaction::getAmount)
                ));
    }

    /**
     * Generate a detailed prompt for the Gemini API
     * @param categorySpending map of spending by category
     * @param user the user object (for income reference)
     * @return the generated prompt
     */
    private String generateFinancialPrompt(Map<String, Double> categorySpending, User user) {
        StringBuilder spendingDetails = new StringBuilder();
        double totalSpending = 0;

        // Build spending details
        for (Map.Entry<String, Double> entry : categorySpending.entrySet()) {
            spendingDetails.append(String.format("• %s: $%.2f\n", entry.getKey(), entry.getValue()));
            totalSpending += entry.getValue();
        }

        // Build prompt
        return String.format(
                "As an expert financial advisor, analyze the following monthly spending breakdown:\n" +
                        "\n%s" +
                        "\nTotal Monthly Spending: $%.2f\n" +
                        "Monthly Income: $%.2f\n" +
                        "\n" +
                        "Provide 3-4 concise, actionable bullet points of personalized financial advice based on this data. " +
                        "Focus on:\n" +
                        "1. Areas where the user could potentially save money\n" +
                        "2. Healthy spending patterns or concerning trends\n" +
                        "3. Recommendations for budget optimization\n" +
                        "4. Positive reinforcement for good financial habits (if applicable)\n" +
                        "\n" +
                        "Keep advice practical and encouraging. Format as bullet points (use •).",
                spendingDetails.toString(),
                totalSpending,
                user.getTotalIncome() != null ? user.getTotalIncome() : 0.0
        );
    }

    /**
     * Call Gemini API with the generated prompt
     * @param prompt the prompt to send to Gemini
     * @return the AI-generated response
     */
    private String callGeminiApi(String prompt) {
        try {
            String endpoint = String.format(
                    "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                    geminiModel,
                    geminiApiKey
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Build request body
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(part));

            Map<String, Object> body = new HashMap<>();
            body.put("contents", List.of(content));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            // Make API call
            ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, request, Map.class);
            Map<String, Object> responseBody = response.getBody();

            return extractTextFromGeminiResponse(responseBody);
        } catch (Exception e) {
            log.error("Error calling Gemini API", e);
            return "❌ Failed to fetch AI insights: " + e.getMessage();
        }
    }

    /**
     * Extract text from Gemini API response
     * @param responseBody the response from Gemini
     * @return the extracted text content
     */
    private String extractTextFromGeminiResponse(Map<String, Object> responseBody) {
        if (responseBody == null) {
            return "Gemini returned an empty response.";
        }

        try {
            Object candidatesObj = responseBody.get("candidates");
            if (!(candidatesObj instanceof List<?> candidates) || candidates.isEmpty()) {
                log.warn("No candidates in Gemini response");
                return "Gemini did not return any insights. Please try again.";
            }

            Object firstCandidateObj = candidates.get(0);
            if (!(firstCandidateObj instanceof Map<?, ?> firstCandidate)) {
                log.warn("Unexpected candidate format");
                return "Gemini response format was unexpected.";
            }

            Object contentObj = firstCandidate.get("content");
            if (!(contentObj instanceof Map<?, ?> content)) {
                log.warn("Unexpected content format");
                return "Gemini response format was unexpected.";
            }

            Object partsObj = content.get("parts");
            if (!(partsObj instanceof List<?> parts) || parts.isEmpty()) {
                log.warn("No parts in Gemini response");
                return "Gemini response format was unexpected.";
            }

            Object firstPartObj = parts.get(0);
            if (!(firstPartObj instanceof Map<?, ?> firstPart)) {
                log.warn("Unexpected part format");
                return "Gemini response format was unexpected.";
            }

            Object textObj = firstPart.get("text");
            if (textObj instanceof String text) {
                log.info("Successfully extracted text from Gemini response");
                return text;
            }

            log.warn("No text found in first part");
            return "Could not extract text from Gemini response.";
        } catch (Exception e) {
            log.error("Error parsing Gemini response", e);
            return "Error parsing Gemini response: " + e.getMessage();
        }
    }

    /**
     * Get spending statistics for a specific month
     * @param email the user's email
     * @param month the month (1-12)
     * @param year the year
     * @return map of category spending
     */
    public Map<String, Double> getMonthlyCategorySpending(String email, int month, int year) {
        List<Transaction> transactions = transactionRepository
                .findByMonthAndYearAndUser_Email(month, year, email);

        if (transactions == null || transactions.isEmpty()) {
            return new HashMap<>();
        }

        return buildCategorySpending(transactions);
    }
}
