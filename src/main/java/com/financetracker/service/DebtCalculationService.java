package com.financetracker.service;

import com.financetracker.entity.ExpenseGroup;
import com.financetracker.entity.ExpenseSplit;
import com.financetracker.entity.GroupExpense;
import com.financetracker.entity.User;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DebtCalculationService {

    public static class Debt {
        public User debtor;
        public User creditor;
        public double amount;

        public Debt(User debtor, User creditor, double amount) {
            this.debtor = debtor;
            this.creditor = creditor;
            this.amount = Math.round(amount * 100.0) / 100.0;
        }
    }

    public List<Debt> calculateSettlements(ExpenseGroup group) {
        Map<Long, Double> balances = new HashMap<>();
        Map<Long, User> userMap = new HashMap<>();

        // Initialize balances for all group members
        group.getMemberships().forEach(m -> {
            balances.put(m.getUser().getId(), 0.0);
            userMap.put(m.getUser().getId(), m.getUser());
        });

        // Calculate net balances based on expenses
        for (GroupExpense expense : group.getGroupExpenses()) {
            User payer = expense.getPayer();
            double totalAmount = expense.getTotalAmount();
            
            // The payer's balance goes up by the total amount (they are owed this money)
            balances.put(payer.getId(), balances.getOrDefault(payer.getId(), 0.0) + totalAmount);
            
            // Deduct the split amounts from each debtor's balance
            if (expense.getSplits() != null && !expense.getSplits().isEmpty()) {
                for (ExpenseSplit split : expense.getSplits()) {
                    User debtor = split.getDebtor();
                    double amountOwed = split.getAmountOwed();
                    balances.put(debtor.getId(), balances.getOrDefault(debtor.getId(), 0.0) - amountOwed);
                }
            } else {
                // Fallback: Equal split if no explicit splits are provided
                double equalShare = totalAmount / group.getMemberships().size();
                for (Long userId : balances.keySet()) {
                    balances.put(userId, balances.get(userId) - equalShare);
                }
            }
        }

        // Simplify debts
        List<Map.Entry<Long, Double>> debtors = new ArrayList<>();
        List<Map.Entry<Long, Double>> creditors = new ArrayList<>();

        for (Map.Entry<Long, Double> entry : balances.entrySet()) {
            if (entry.getValue() < -0.01) {
                debtors.add(new AbstractMap.SimpleEntry<>(entry.getKey(), -entry.getValue()));
            } else if (entry.getValue() > 0.01) {
                creditors.add(new AbstractMap.SimpleEntry<>(entry.getKey(), entry.getValue()));
            }
        }

        List<Debt> settledDebts = new ArrayList<>();
        int i = 0; // Debtors index
        int j = 0; // Creditors index

        while (i < debtors.size() && j < creditors.size()) {
            Map.Entry<Long, Double> debtor = debtors.get(i);
            Map.Entry<Long, Double> creditor = creditors.get(j);

            double amount = Math.min(debtor.getValue(), creditor.getValue());

            settledDebts.add(new Debt(userMap.get(debtor.getKey()), userMap.get(creditor.getKey()), amount));

            debtor.setValue(debtor.getValue() - amount);
            creditor.setValue(creditor.getValue() - amount);

            if (debtor.getValue() < 0.01) {
                i++;
            }
            if (creditor.getValue() < 0.01) {
                j++;
            }
        }

        return settledDebts;
    }
}
