package com.financetracker.repository;

import com.financetracker.entity.UserLoginHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserLoginHistoryRepository extends JpaRepository<UserLoginHistory, Long> {
    List<UserLoginHistory> findByUserIdOrderByLoginTimestampDesc(Long userId);
    int countByUserId(Long userId);
    
    @Query("SELECT COUNT(DISTINCT h.user.id) FROM UserLoginHistory h WHERE h.loginTimestamp >= :since")
    long countActiveUsersSince(@Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(h) FROM UserLoginHistory h WHERE h.loginTimestamp >= :startOfDay")
    long countLoginsSince(@Param("startOfDay") LocalDateTime startOfDay);
    
    List<UserLoginHistory> findAllByOrderByLoginTimestampDesc();
    
    List<UserLoginHistory> findTop50ByOrderByLoginTimestampDesc();

    org.springframework.data.domain.Page<UserLoginHistory> findAllByOrderByLoginTimestampDesc(org.springframework.data.domain.Pageable pageable);
}
