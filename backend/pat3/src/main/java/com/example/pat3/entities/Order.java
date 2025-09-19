package com.example.pat3.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToMany
    @JoinTable(
            name = "order_product",
            joinColumns = @JoinColumn(name = "order_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    private List<Product> products;

    private LocalDateTime orderDate;
    private Double total;
    private String status;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = true) // Rendre nullable temporairement pour tester
    private User user;
    @Embeddable
    @Data // Ajouter @Data pour générer les getters/setters
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BuyerDetails {
        private String name;
        private String surname;
        private String phone;
        private String address;
    }

    @Embedded
    private BuyerDetails buyerDetails;
}