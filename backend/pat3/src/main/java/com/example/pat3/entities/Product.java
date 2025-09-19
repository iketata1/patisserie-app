package com.example.pat3.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String category;
    private String description;
    private String imageUrl;
    private String name;

    // Prix / kg si weightBased = true, sinon prix / pièce
    private Double price;     // wrapper -> peut être null

    // Stock (kg si weightBased = true, sinon nombre de pièces)
    private Double stock;     // wrapper -> peut être null

    // Quantité commandée (en grammes si weightBased = true, sinon en pièces)
    // Non persisté en base (utile pour DTO / calculs)
    @Transient
    private Double quantity;  // wrapper -> peut être null

    private String status;

    // Vendu au poids ?
    private Boolean weightBased = Boolean.FALSE;
}
