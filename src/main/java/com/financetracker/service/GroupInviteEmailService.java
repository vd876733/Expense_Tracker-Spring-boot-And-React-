package com.financetracker.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class GroupInviteEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    public GroupInviteEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendInviteEmail(String toEmail, String groupName, Long groupId) {
        String link = String.format("http://localhost:3000/insights?groupId=%d&action=accept", groupId);
        String subject = "You're invited to join a group";
        String body = buildHtmlBody(groupName, link);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(toEmail);
            if (fromAddress != null && !fromAddress.isBlank()) {
                helper.setFrom(fromAddress);
            }
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
        } catch (MessagingException ex) {
            throw new IllegalStateException("Failed to send invite email", ex);
        }
    }

    private String buildHtmlBody(String groupName, String link) {
        String safeGroup = groupName == null ? "your group" : groupName;
        return """
            <div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#111827;\">
              <h2 style=\"margin:0 0 12px;\">You're invited!</h2>
              <p>You have been invited to join the group <strong>""" + safeGroup + """</strong>.</p>
              <p>Click the button below to accept the invitation:</p>
              <p>
                <a href=\"""" + link + """\"
                   style=\"display:inline-block;background:#f97316;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;\">
                  Accept Invitation
                </a>
              </p>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style=\"word-break:break-all;\">""" + link + """</p>
            </div>
            """;
    }
}
