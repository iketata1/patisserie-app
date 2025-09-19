package com.example.pat3.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String password;
    private String email;
    private String nom;
    private String prenom;
    private String adresse;
    private String telephone;

    @ElementCollection(fetch = FetchType.EAGER)
    @Column(name = "role")
    private List<String> roles;
}