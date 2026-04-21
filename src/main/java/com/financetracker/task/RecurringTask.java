package com.financetracker.task;

import com.financetracker.entity.RecurringTransaction;
import com.financetracker.entity.Transaction;
import com.financetracker.repository.RecurringTransactionRepository;
import com.financetracker.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Component
public class RecurringTask {

    private final RecurringTransactionRepository recurringTransactionRepository;
    private final TransactionRepository transactionRepository;

    @Autowired
    public RecurringTask(RecurringTransactionRepository recurringTransactionRepository,
                         TransactionRepository transactionRepository) {
        this.recurringTransactionRepository = recurringTransactionRepository;
        this.transactionRepository = transactionRepository;
    }

    @Scheduled(cron = "0 0 0 1 * *")
    public void generateMonthlyTransactions() {
        YearMonth currentMonth = YearMonth.now();
        LocalDate firstDayOfMonth = currentMonth.atDay(1);

        List<RecurringTransaction> recurringTemplates = recurringTransactionRepository.findAll();

        for (RecurringTransaction template : recurringTemplates) {
            if (Boolean.FALSE.equals(template.getActive())) {
                continue;
            }

            int day = Math.min(template.getDayOfMonth(), currentMonth.lengthOfMonth());
            LocalDate scheduledDate = currentMonth.atDay(day);

            boolean alreadyCreated = transactionRepository.existsByDescriptionAndCategoryAndAmountAndDate(
                    template.getDescription(),
                    template.getCategory(),
                    template.getAmount(),
                    scheduledDate
            );

            if (alreadyCreated) {
                continue;
            }

            Transaction transaction = new Transaction();
            transaction.setDescription(template.getDescription());
            transaction.setAmount(template.getAmount());
            transaction.setCategory(template.getCategory());
            transaction.setDate(scheduledDate);
            transactionRepository.save(transaction);
        }
    }
}
