package com.example.pat3.config;

import com.example.pat3.entities.User;
import com.example.pat3.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.*;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.Objects;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // <— AJOUTE-LE

public class SecurityConfig {

    @Autowired @Lazy private UserService userService;
    @Autowired private JwtRequestFilter jwtRequestFilter;

    @Bean
    SecurityFilterChain filterChain(org.springframework.security.config.annotation.web.builders.HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(reg -> reg
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()                    // <- important
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/api/users/login", "/api/users/register").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()

                        .requestMatchers(HttpMethod.GET,  "/api/orders/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT,  "/api/orders/**").hasRole("ADMIN") // <- ajoute ça
                        .requestMatchers(HttpMethod.GET,  "/api/users").hasRole("ADMIN")

                        .requestMatchers("/api/client/**").hasAnyRole("CLIENT","ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )

                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            User user = userService.findByUsername(username);
            if (user == null) throw new UsernameNotFoundException("User not found: " + username);

            // Normalise les rôles: supprime "ROLE_" éventuel, trim et uppercase
            String[] roles = user.getRoles().stream()
                    .filter(Objects::nonNull)
                    .map(r -> r.replaceFirst("^ROLE_", "")) // évite ROLE_ROLE_*
                    .map(String::trim)
                    .map(String::toUpperCase)              // "admin" -> "ADMIN"
                    .toArray(String[]::new);
            System.out.println("[USER DETAILS] " + user.getUsername() + " roles=" + String.join(",", roles));

            return org.springframework.security.core.userdetails.User
                    .withUsername(user.getUsername())
                    .password(user.getPassword())
                    .roles(roles) // Spring fabriquera ROLE_ADMIN, ROLE_CLIENT…
                    .build();
        };
    }

}
