package com.financetracker.repository;

import com.financetracker.entity.CategoryCap;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CategoryCapRepository extends JpaRepository<CategoryCap, Long> {
    List<CategoryCap> findByUser_Email(String email);
    Optional<CategoryCap> findByCategoryNameAndUser_Email(String categoryName, String email);
}
