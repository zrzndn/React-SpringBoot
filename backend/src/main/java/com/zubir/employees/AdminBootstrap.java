package com.zubir.employees;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log =
        LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserAccountRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    public AdminBootstrap(
            UserAccountRepository repository,
            PasswordEncoder passwordEncoder,
            Environment environment) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        String username = environment.getProperty("APP_ADMIN_USERNAME");
        String password = environment.getProperty("APP_ADMIN_PASSWORD");

        if (username == null || username.isBlank()
                || password == null || password.isBlank()) {
            log.warn("Admin account bootstrap skipped: credentials are not configured.");
            return;
        }

        if (password.length() < 12) {
            throw new IllegalStateException(
                "Initial admin password must be at least 12 characters."
            );
        }

        if (!repository.existsByUsername(username)) {
            repository.save(new UserAccount(
                username,
                passwordEncoder.encode(password),
                "ADMIN"
            ));

            log.info("Initial administrator account created.");
        }
    }
}