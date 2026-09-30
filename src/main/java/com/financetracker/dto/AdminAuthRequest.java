package com.financetracker.dto;

import lombok.Data;

@Data
public class AdminAuthRequest {
    private String email;
    private String password;
}
