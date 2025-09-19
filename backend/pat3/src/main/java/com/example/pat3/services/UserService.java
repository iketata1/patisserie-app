package com.example.pat3.services;

import com.example.pat3.entities.User;
import com.example.pat3.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    public List<User> getAll() {
        return userRepository.findAll();
    }

    public User registerUser(String username, String password, String email,
                             String nom, String prenom, String adresse,
                             String telephone, List<String> roles) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        user.setNom(nom);
        user.setPrenom(prenom);
        user.setAdresse(adresse);
        user.setTelephone(telephone);

        // Nettoyage des rôles (sans ROLE_)
        user.setRoles(roles != null ? roles.stream()
                .map(role -> role.startsWith("ROLE_") ? role.substring(5) : role)
                .collect(Collectors.toList()) : List.of("CLIENT"));

        return userRepository.save(user);
    }

    public User findByUsername(String username) {
        Optional<User> user = userRepository.findByUsername(username);
        return user.orElse(null);
    }
}
