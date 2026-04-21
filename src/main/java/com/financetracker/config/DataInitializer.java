package com.financetracker.config;

import com.financetracker.entity.User;
import com.financetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Data Initializer
 * Creates a default admin user if no users exist in the database.
 * This is useful for development and demo purposes.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Check if any users exist
        if (userRepository.count() == 0) {
            // Create default admin user
            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setEmail("admin@example.com");
            adminUser.setPassword(passwordEncoder.encode("admin123"));

            userRepository.save(adminUser);

            System.out.println("Default admin user created:");
            System.out.println("Username: admin");
            System.out.println("Password: admin123");
            System.out.println("Email: admin@example.com");
        } else {
            System.out.println("Users already exist in the database. Skipping default user creation.");
        }
    }
}