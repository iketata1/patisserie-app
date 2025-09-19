package com.example.pat3.controller;

import com.example.pat3.config.JwtUtil;
import com.example.pat3.entities.User;
import com.example.pat3.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;
    @GetMapping("")
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> listUsers() {
        return userService.getAll(); // ou userRepository.findAll()
    }
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody User user) {
        if (userService.findByUsername(user.getUsername()) != null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }
        userService.registerUser(
                user.getUsername(), user.getPassword(), user.getEmail(),
                user.getNom(), user.getPrenom(), user.getAdresse(), user.getTelephone(), user.getRoles()
        );
        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        System.out.println("Attempting login for username: " + loginRequest.getUsername());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );
            System.out.println("Authentication successful for: " + loginRequest.getUsername());
            UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUsername());
            System.out.println("User details loaded: " + userDetails.getUsername() + ", roles: " + userDetails.getAuthorities());
            String token = jwtUtil.generateToken(userDetails);
            System.out.println("Token generated successfully: " + token);
            return ResponseEntity.ok(new JwtResponse(token));
        } catch (Exception e) {
            System.out.println("Authentication failed: " + e.getMessage());
            return ResponseEntity.status(401).body("Invalid credentials or token generation failed");
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        User user = userService.findByUsername(username);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }


    @GetMapping("/refresh-token")
    public ResponseEntity<?> refreshToken() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        if (username == null) {
            return ResponseEntity.status(401).body("User not authenticated");
        }
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        String newToken = jwtUtil.generateToken(userDetails);
        System.out.println("Refreshed token for user: " + username + ", new token: " + newToken);
        return ResponseEntity.ok(new JwtResponse(newToken));
    }
    @RestController
    @RequestMapping("/api/debug")
    public class DebugController {
        @GetMapping("/whoami")
        public Map<String,Object> whoAmI(Authentication auth) {
            return Map.of(
                    "user", auth==null?null:auth.getName(),
                    "authorities", auth==null?List.of():auth.getAuthorities()
            );
        }
    }

}

class JwtResponse {
    private String token;

    public JwtResponse(String token) {
        this.token = token;
    }

    public String getToken() {
        return token;
    }
}

class LoginRequest {
    private String username;
    private String password;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}