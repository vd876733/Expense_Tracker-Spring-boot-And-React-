package com.financetracker.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SmsService {

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.phone-number:}")
    private String twilioPhoneNumber;

    private boolean isConfigured = false;

    @PostConstruct
    public void init() {
        if (accountSid != null && !accountSid.isBlank() && 
            authToken != null && !authToken.isBlank() && 
            twilioPhoneNumber != null && !twilioPhoneNumber.isBlank()) {
            Twilio.init(accountSid, authToken);
            isConfigured = true;
            System.out.println("Twilio SMS Service initialized.");
        } else {
            System.out.println("Twilio SMS Service is running in STUB mode (missing credentials).");
        }
    }

    public void sendSms(String toPhoneNumber, String messageBody) {
        if (!isConfigured) {
            System.out.println("STUB: Sending SMS to " + toPhoneNumber);
            System.out.println("Message: " + messageBody);
            return;
        }

        try {
            Message message = Message.creator(
                    new PhoneNumber(toPhoneNumber),
                    new PhoneNumber(twilioPhoneNumber),
                    messageBody
            ).create();
            System.out.println("Sent SMS with SID: " + message.getSid());
        } catch (Exception e) {
            System.err.println("Failed to send SMS to " + toPhoneNumber + ". Error: " + e.getMessage());
        }
    }
}
