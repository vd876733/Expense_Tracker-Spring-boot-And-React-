package com.financetracker.repository;

import com.financetracker.entity.UserCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCategoryRepository extends JpaRepository<UserCategory, Long> {
    List<UserCategory> findByUserId(Long userId);
    Optional<UserCategory> findByUserIdAndNameIgnoreCase(Long userId, String name);
}
