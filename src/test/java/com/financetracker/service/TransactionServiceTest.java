package com.financetracker.service;

import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private TransactionService transactionService;

    @Test
    void addTransaction_shouldSaveTransaction_whenAmountIsPositive() {
        Transaction transaction = new Transaction();
        transaction.setDescription("Coffee");
        transaction.setAmount(4.50);
        transaction.setDate(LocalDate.now());
        transaction.setCategory("Food");
        transaction.setUserEmail("test@example.com");

        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setUsername("testuser");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(transactionRepository.sumIncomeByUserEmail("test@example.com")).thenReturn(100.0);
        when(transactionRepository.sumExpensesByUserEmail("test@example.com")).thenReturn(0.0);
        when(transactionRepository.save(transaction)).thenReturn(transaction);

        Transaction saved = transactionService.addTransaction(transaction);

        assertSame(transaction, saved);
        verify(transactionRepository, times(1)).save(transaction);
    }

    @Test
    void addTransaction_shouldThrowException_whenAmountIsNegative() {
        Transaction transaction = new Transaction();
        transaction.setDescription("Refund");
        transaction.setAmount(-10.00);
        transaction.setDate(LocalDate.now());
        transaction.setCategory("Other");
        transaction.setUserEmail("test@example.com");

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> transactionService.addTransaction(transaction)
        );

        assertEquals("Transaction amount must be non-negative", exception.getMessage());
        verify(transactionRepository, never()).save(transaction);
    }
}
