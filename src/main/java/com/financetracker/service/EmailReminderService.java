package com.financetracker.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailReminderService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    public EmailReminderService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendGroupReminder(String debtorEmail, String creditorName, Double amountOwed) {
        SimpleMailMessage message = new SimpleMailMessage();
        if (fromAddress != null && !fromAddress.isBlank()) {
            message.setFrom(fromAddress);
        }
        message.setTo(debtorEmail);
        message.setSubject("Group Expense Reminder");
        message.setText(buildEmailBody(creditorName, amountOwed));
        mailSender.send(message);
    }

    private String buildEmailBody(String creditorName, Double amountOwed) {
        String formattedAmount = String.format("\u20B9%.0f", amountOwed == null ? 0 : amountOwed);
        return String.join(
                "\n",
                "Hello,",
                "",
                "This is a friendly reminder that you have an outstanding group expense balance.",
                "",
                "Creditor: " + creditorName,
                "Amount owed: " + formattedAmount,
                "",
                "Please settle the balance at your earliest convenience.",
                "",
                "Thanks,",
                "Finance Tracker"
        );
    }
}
