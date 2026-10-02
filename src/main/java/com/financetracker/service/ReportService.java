package com.financetracker.service;

import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender javaMailSender;

    @jakarta.annotation.PostConstruct
    public void testPdf() {
        try {
            System.out.println("TESTING PDF GENERATION ON STARTUP...");
            generateReportPdf(LocalDate.now().minusDays(10), LocalDate.now(), 1L);
            System.out.println("PDF GENERATION SUCCESSFUL!");
        } catch (Exception e) {
            System.err.println("PDF GENERATION FAILED WITH EXCEPTION:");
            e.printStackTrace();
        }
    }

    public byte[] generateReportPdf(LocalDate startDate, LocalDate endDate, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Transaction> transactions = transactionRepository.findByDateRangeAndUser_Email(startDate, endDate, user.getEmail());

        if (transactions == null) {
            transactions = List.of();
        }

        double totalIncome = transactions.stream()
                .filter(t -> t.getAmount() != null && t.getAmount() > 0)
                .mapToDouble(Transaction::getAmount)
                .sum();

        double totalExpenses = transactions.stream()
                .filter(t -> t.getAmount() != null && t.getAmount() < 0)
                .mapToDouble(t -> Math.abs(t.getAmount()))
                .sum();

        double moneySaved = totalIncome - totalExpenses;
        double savingsRate = totalIncome > 0 ? (moneySaved / totalIncome) * 100 : 0;

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Header
        Paragraph header = new Paragraph("Kosh Digital Treasury Statement")
                .setBold()
                .setFontSize(20)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(header);

        // Summary Table
        Table summaryTable = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();
        summaryTable.addHeaderCell(new Cell().add(new Paragraph("Total Income").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
        summaryTable.addCell(String.format("$%.2f", totalIncome));
        summaryTable.addHeaderCell(new Cell().add(new Paragraph("Total Expenses").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
        summaryTable.addCell(String.format("$%.2f", totalExpenses));
        summaryTable.addHeaderCell(new Cell().add(new Paragraph("Money Saved").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
        summaryTable.addCell(String.format("$%.2f", moneySaved));
        summaryTable.addHeaderCell(new Cell().add(new Paragraph("Savings Rate").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
        summaryTable.addCell(String.format("%.2f%%", savingsRate));

        document.add(summaryTable.setMarginBottom(20));

        // Category Breakdown Analytics
        Paragraph categoryHeader = new Paragraph("Category Breakdown Analytics")
                .setBold()
                .setFontSize(16)
                .setMarginBottom(10);
        document.add(categoryHeader);

        Map<String, Double> categoryTotals = transactions.stream()
                .filter(t -> t.getCategory() != null && t.getAmount() != null)
                .collect(Collectors.groupingBy(Transaction::getCategory, Collectors.summingDouble(Transaction::getAmount)));

        Table categoryTable = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();
        categoryTable.addHeaderCell(new Cell().add(new Paragraph("Category").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
        categoryTable.addHeaderCell(new Cell().add(new Paragraph("Total Amount").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));

        categoryTotals.forEach((category, amount) -> {
            categoryTable.addCell(category);
            categoryTable.addCell(String.format("$%.2f", amount));
        });

        document.add(categoryTable.setMarginBottom(20));

        // Detailed Transaction Table
        Paragraph transactionHeader = new Paragraph("Detailed Transactions")
                .setBold()
                .setFontSize(16)
                .setMarginBottom(10);
        document.add(transactionHeader);

        Table transactionTable = new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25})).useAllAvailableWidth();
        transactionTable.addHeaderCell(new Cell().add(new Paragraph("Date").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
        transactionTable.addHeaderCell(new Cell().add(new Paragraph("Description").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
        transactionTable.addHeaderCell(new Cell().add(new Paragraph("Category").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));
        transactionTable.addHeaderCell(new Cell().add(new Paragraph("Amount").setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY));

        for (Transaction t : transactions) {
            transactionTable.addCell(t.getDate() != null ? t.getDate().toString() : "N/A");
            transactionTable.addCell(t.getDescription() != null ? t.getDescription() : "");
            transactionTable.addCell(t.getCategory() != null ? t.getCategory() : "Uncategorized");
            transactionTable.addCell(t.getAmount() != null ? String.format("$%.2f", t.getAmount()) : "$0.00");
        }

        document.add(transactionTable);
        document.close();

        return baos.toByteArray();
    }

    public void sendReportByEmail(LocalDate startDate, LocalDate endDate, String userEmail, Long userId) {
        try {
            byte[] pdfBytes = generateReportPdf(startDate, endDate, userId);

            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(userEmail);
            helper.setSubject("Your Kosh Digital Treasury Statement");
            helper.setText("Please find your financial report attached for the period " + startDate + " to " + endDate + ".");
            helper.addAttachment("Treasury_Statement.pdf", new ByteArrayResource(pdfBytes));

            javaMailSender.send(message);
        } catch (org.springframework.mail.MailAuthenticationException mae) {
            System.err.println("Mail Authentication Failed. Check spring.mail.username and spring.mail.password. " + mae.getMessage());
            throw new RuntimeException("Email server authentication failed. Please configure valid SMTP credentials.", mae);
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
            throw new RuntimeException("Failed to send report email", e);
        }
    }
}
