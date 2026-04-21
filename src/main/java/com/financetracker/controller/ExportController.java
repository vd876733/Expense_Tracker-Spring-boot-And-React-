package com.financetracker.controller;

import com.financetracker.entity.Transaction;
import com.financetracker.repository.TransactionRepository;
import com.lowagie.text.Chapter;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    @Autowired
    private TransactionRepository transactionRepository;

    @GetMapping(value = "/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> exportCurrentMonthTransactionsPdf() throws DocumentException {
        YearMonth currentMonth = YearMonth.now();
        List<Transaction> transactions = transactionRepository.findByMonthAndYear(
                currentMonth.getMonthValue(), currentMonth.getYear());

        double totalSpent = transactions.stream()
                .mapToDouble(Transaction::getAmount)
                .sum();

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 48, 36);
        PdfWriter.getInstance(document, outputStream);

        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
        Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

        Paragraph title = new Paragraph("Monthly Expense Report", titleFont);
        title.setAlignment(Paragraph.ALIGN_CENTER);
        document.add(title);

        Paragraph month = new Paragraph(
                currentMonth.format(DateTimeFormatter.ofPattern("MMMM yyyy")),
                subtitleFont
        );
        month.setAlignment(Paragraph.ALIGN_CENTER);
        document.add(month);

        document.add(Chunk.NEWLINE);

        Paragraph summary = new Paragraph(
                String.format("Total spent: $%.2f", totalSpent),
                subtitleFont
        );
        summary.setAlignment(Paragraph.ALIGN_CENTER);
        document.add(summary);

        document.add(Chunk.NEWLINE);

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{2.5f, 4f, 3f, 2f});

        addCell(table, "Date", headerFont);
        addCell(table, "Description", headerFont);
        addCell(table, "Category", headerFont);
        addCell(table, "Amount", headerFont);

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");

        for (Transaction transaction : transactions) {
            addCell(table, transaction.getDate().format(dateFormatter), normalFont);
            addCell(table, transaction.getDescription(), normalFont);
            addCell(table, transaction.getCategory(), normalFont);
            addCell(table, String.format("$%.2f", transaction.getAmount()), normalFont);
        }

        document.add(table);
        document.close();

        byte[] bytes = outputStream.toByteArray();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData(
                "attachment",
                String.format("expense-report-%d-%d.pdf", currentMonth.getMonthValue(), currentMonth.getYear())
        );

        return ResponseEntity.ok()
                .headers(headers)
                .body(bytes);
    }

    private void addCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(8);
        table.addCell(cell);
    }
}
