package com.financetracker.service;

import com.financetracker.entity.Transaction;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    private final RestTemplate restTemplate = new RestTemplate();

    public String getFinancialInsights(List<Transaction> data) {
        if (data == null || data.isEmpty()) {
            return "No transaction data found yet. Add transactions to receive AI-driven insights.";
        }

        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return "Gemini API key is not configured. Set gemini.api.key in application properties or environment.";
        }

        String transactionSummary = data.stream()
                .limit(150)
                .map(t -> String.format("- %s | %s | %.2f", t.getDate(), t.getDescription(), t.getAmount()))
                .collect(Collectors.joining("\n"));

        String prompt = "You are an expert personal financial advisor. I will provide you with a user's recent transaction history. " +
            "Your goal is to provide two concise, actionable, and encouraging financial tips based only on this data. " +
            "Do not use markdown headers, just return a short paragraph. " +
            "Data: " + transactionSummary;

        String endpoint = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel,
                geminiApiKey
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));

        Map<String, Object> body = new HashMap<>();
        body.put("contents", List.of(content));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            return extractTextFromGeminiResponse(responseBody);
        } catch (Exception ex) {
            return "Failed to fetch AI insights from Gemini: " + ex.getMessage();
        }
    }

    private String extractTextFromGeminiResponse(Map<String, Object> responseBody) {
        if (responseBody == null) {
            return "Gemini returned an empty response.";
        }

        Object candidatesObj = responseBody.get("candidates");
        if (!(candidatesObj instanceof List<?> candidates) || candidates.isEmpty()) {
            return "Gemini did not return any insight candidates.";
        }

        Object firstCandidateObj = candidates.get(0);
        if (!(firstCandidateObj instanceof Map<?, ?> firstCandidate)) {
            return "Gemini response format was unexpected (candidate).";
        }

        Object contentObj = firstCandidate.get("content");
        if (!(contentObj instanceof Map<?, ?> content)) {
            return "Gemini response format was unexpected (content).";
        }

        Object partsObj = content.get("parts");
        if (!(partsObj instanceof List<?> parts) || parts.isEmpty()) {
            return "Gemini response format was unexpected (parts).";
        }

        Object firstPartObj = parts.get(0);
        if (!(firstPartObj instanceof Map<?, ?> firstPart)) {
            return "Gemini response format was unexpected (part).";
        }

        Object textObj = firstPart.get("text");
        return textObj != null ? String.valueOf(textObj) : "Gemini returned no text insight.";
    }
}
