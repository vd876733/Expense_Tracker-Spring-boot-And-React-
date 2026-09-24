package com.financetracker.repository;

import com.financetracker.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByUser_EmailOrderByPriorityRankAsc(String email);
    Optional<Goal> findByIdAndUser_Email(Long id, String email);
}
