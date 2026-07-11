package com.financetracker.repository;

import com.financetracker.entity.SavingsGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavingsGoalRepository extends JpaRepository<SavingsGoal, Long> {

    /**
     * Find all savings goals for a specific user by their ID
     * @param userId the user's ID
     * @return List of savings goals for the user
     */
    @Query("SELECT sg FROM SavingsGoal sg WHERE sg.user.id = :userId ORDER BY sg.deadline ASC")
    List<SavingsGoal> findByUserId(@Param("userId") Long userId);

    /**
     * Find all savings goals for a specific user by their email
     * @param email the user's email
     * @return List of savings goals for the user
     */
    @Query("SELECT sg FROM SavingsGoal sg WHERE sg.user.email = :email ORDER BY sg.deadline ASC")
    List<SavingsGoal> findByUserEmail(@Param("email") String email);

    /**
     * Find achieved savings goals for a user
     * @param userId the user's ID
     * @return List of achieved savings goals
     */
    @Query("SELECT sg FROM SavingsGoal sg WHERE sg.user.id = :userId AND sg.currentAmount >= sg.targetAmount ORDER BY sg.deadline ASC")
    List<SavingsGoal> findAchievedGoalsByUserId(@Param("userId") Long userId);

    /**
     * Find active (not achieved) savings goals for a user
     * @param userId the user's ID
     * @return List of active savings goals
     */
    @Query("SELECT sg FROM SavingsGoal sg WHERE sg.user.id = :userId AND sg.currentAmount < sg.targetAmount ORDER BY sg.deadline ASC")
    List<SavingsGoal> findActiveGoalsByUserId(@Param("userId") Long userId);
}
