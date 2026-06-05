package com.financetracker.repository;

import com.financetracker.entity.GroupMembership;
import com.financetracker.entity.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMembershipRepository extends JpaRepository<GroupMembership, Long> {

    Optional<GroupMembership> findByExpenseGroupIdAndUserId(Long expenseGroupId, Long userId);

    @Query("SELECT gm FROM GroupMembership gm WHERE gm.user.id = :userId AND gm.status = :status")
    List<GroupMembership> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") MembershipStatus status);
}
