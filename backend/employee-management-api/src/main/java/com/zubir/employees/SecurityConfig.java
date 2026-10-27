package com.zubir.employees;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.spa())

            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/csrf",
                    "/api/auth/login",
                    "/api/auth/logout",
                    "/actuator/health",
                    "/error"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/employees",
                    "/api/employees/**"
                ).hasAnyRole("ADMIN", "USER")

                .requestMatchers("/api/employees/**")
                    .hasRole("ADMIN")

                .anyRequest().authenticated()
            )

            .exceptionHandling(exceptions ->
                exceptions.authenticationEntryPoint(
                    (request, response, exception) -> {
                        response.setStatus(
                            HttpServletResponse.SC_UNAUTHORIZED
                        );
                        response.setContentType(
                            MediaType.APPLICATION_JSON_VALUE
                        );
                        response.getWriter().write(
                            "{\"message\":\"Authentication required\"}"
                        );
                    }
                )
            )

            .formLogin(form -> form
                .loginProcessingUrl("/api/auth/login")
                .usernameParameter("username")
                .passwordParameter("password")

                .successHandler((request, response, authentication) -> {
                    response.setStatus(HttpServletResponse.SC_OK);
                    response.setContentType(
                        MediaType.APPLICATION_JSON_VALUE
                    );
                    response.getWriter().write(
                        "{\"authenticated\":true}"
                    );
                })

                .failureHandler((request, response, exception) -> {
                    response.setStatus(
                        HttpServletResponse.SC_UNAUTHORIZED
                    );
                    response.setContentType(
                        MediaType.APPLICATION_JSON_VALUE
                    );
                    response.getWriter().write(
                        "{\"message\":\"Invalid username or password\"}"
                    );
                })
            )

            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler((request, response, authentication) ->
                    response.setStatus(
                        HttpServletResponse.SC_NO_CONTENT
                    )
                )
            );

        return http.build();
    }
}