package com.financetracker.repository;

import com.financetracker.entity.ExpenseGroup;
import com.financetracker.entity.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ExpenseGroup entity
 * Provides database operations for expense groups
 */
@Repository
public interface ExpenseGroupRepository extends JpaRepository<ExpenseGroup, Long> {

    /**
     * Find all expense groups that a user is a member of
     * @param userId the user's ID
     * @return List of expense groups for the user
     */
    @Query("SELECT eg FROM ExpenseGroup eg JOIN eg.memberships gm WHERE gm.user.id = :userId ORDER BY eg.createdAt DESC")
    List<ExpenseGroup> findByUserId(@Param("userId") Long userId);

    /**
     * Find all expense groups that a user is a member of by email
     * @param email the user's email
     * @return List of expense groups for the user
     */
    @Query("SELECT eg FROM ExpenseGroup eg JOIN eg.memberships gm WHERE gm.user.email = :email ORDER BY eg.createdAt DESC")
    List<ExpenseGroup> findByUserEmail(@Param("email") String email);

    /**
     * Find all expense groups for a user by membership status
     * @param userId the user's ID
     * @param status membership status filter
     * @return List of expense groups
     */
    @Query("SELECT eg FROM ExpenseGroup eg JOIN eg.memberships gm WHERE gm.user.id = :userId AND gm.status = :status ORDER BY eg.createdAt DESC")
    List<ExpenseGroup> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") MembershipStatus status);

    /**
     * Find all expense groups for a user by membership status (email)
     * @param email the user's email
     * @param status membership status filter
     * @return List of expense groups
     */
    @Query("SELECT eg FROM ExpenseGroup eg JOIN eg.memberships gm WHERE gm.user.email = :email AND gm.status = :status ORDER BY eg.createdAt DESC")
    List<ExpenseGroup> findByUserEmailAndStatus(@Param("email") String email, @Param("status") MembershipStatus status);

    /**
     * Find expense groups by group name (partial match)
     * @param groupName the group name to search for
     * @return List of expense groups matching the name
     */
    @Query("SELECT eg FROM ExpenseGroup eg WHERE LOWER(eg.groupName) LIKE LOWER(CONCAT('%', :groupName, '%')) ORDER BY eg.createdAt DESC")
    List<ExpenseGroup> findByGroupNameContainingIgnoreCase(@Param("groupName") String groupName);

    /**
     * Check if a user is a member of a specific expense group
     * @param groupId the group's ID
     * @param userId the user's ID
     * @return true if the user is a member, false otherwise
     */
    @Query("SELECT COUNT(gm) > 0 FROM ExpenseGroup eg JOIN eg.memberships gm WHERE eg.id = :groupId AND gm.user.id = :userId")
    boolean isUserMemberOfGroup(@Param("groupId") Long groupId, @Param("userId") Long userId);

    /**
     * Find an expense group by ID and user ID (to verify membership)
     * @param groupId the group's ID
     * @param userId the user's ID
     * @return Optional containing the expense group if user is a member
     */
    @Query("SELECT eg FROM ExpenseGroup eg JOIN eg.memberships gm WHERE eg.id = :groupId AND gm.user.id = :userId")
    Optional<ExpenseGroup> findByIdAndUserId(@Param("groupId") Long groupId, @Param("userId") Long userId);

    /**
     * Find all expense groups created by or containing a specific user
     * @param userId the user's ID
     * @return List of expense groups
     */
    @Query("SELECT DISTINCT eg FROM ExpenseGroup eg LEFT JOIN eg.memberships gm WHERE gm.user.id = :userId ORDER BY eg.updatedAt DESC")
    List<ExpenseGroup> findAllGroupsForUser(@Param("userId") Long userId);
}
