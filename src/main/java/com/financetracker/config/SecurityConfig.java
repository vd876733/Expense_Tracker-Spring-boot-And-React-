package com.financetracker.config;

import com.financetracker.security.CustomUserDetailsService;
import com.financetracker.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.ignoringRequestMatchers("/api/v1/auth/**").disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/api/v1/auth/**").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/**").permitAll()
                        // CSV Import explicitly requires authentication
                        .requestMatchers("/api/import/**").authenticated()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            System.err.println("[SECURITY] 401 Unauthorized: path=" + request.getRequestURI() 
                                    + " reason=" + authException.getMessage());
                            System.err.println("[SECURITY] Authorization header present? " + 
                                    (request.getHeader("Authorization") != null));
                            response.sendError(401, "Unauthorized - Missing or invalid authentication");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            System.err.println("[SECURITY] 403 Access Denied: method=" + request.getMethod()
                                    + " path=" + request.getRequestURI()
                                    + " reason=" + accessDeniedException.getMessage());
                            response.sendError(403, "Forbidden");
                        })
                )
                .headers(headers -> headers
                        .addHeaderWriter(new StaticHeadersWriter(
                                "Cross-Origin-Opener-Policy",
                                "same-origin-allow-popups"
                        ))
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration authConfiguration = new CorsConfiguration();
                authConfiguration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
                authConfiguration.setAllowCredentials(true);
                authConfiguration.setAllowedMethods(Arrays.asList("POST", "OPTIONS"));
                authConfiguration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Cache-Control"));

                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
                configuration.setAllowCredentials(true);
                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Cache-Control"));

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/api/v1/auth/**", authConfiguration);
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder authenticationManagerBuilder =
                http.getSharedObject(AuthenticationManagerBuilder.class);
        authenticationManagerBuilder
                .userDetailsService(customUserDetailsService)
                .passwordEncoder(passwordEncoder);
        return authenticationManagerBuilder.build();
    }
}