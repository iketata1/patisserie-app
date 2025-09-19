// src/main/java/com/example/pat3/controller/CartController.java
package com.example.pat3.controller;

import com.example.pat3.entities.Product;
import com.example.pat3.repository.ProductRepository;
import com.example.pat3.services.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api")
public class CartController {

    @Autowired
    private CartService cartService;

    @Autowired
    private ProductRepository productRepository;

    /**
     * Ajoute un produit au panier.
     * - Produit au poids (weightBased=true): utiliser `grams` (défaut 1000 = 1kg)
     * - Produit à la pièce: utiliser `qty` (défaut 1 pièce)
     */
    @PostMapping("/cart")
    @PreAuthorize("hasAnyRole('CLIENT','ADMIN')")
    public ResponseEntity<?> addToCart(@RequestParam Long productId,
                                       @RequestParam(required = false) Double grams,
                                       @RequestParam(required = false) Double qty,
                                       Principal principal) {

        Product p = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Produit introuvable: " + productId));

        double amount;
        if (Boolean.TRUE.equals(p.getWeightBased())) {
            // au poids -> unités attendues en grammes
            amount = (grams == null || grams <= 0) ? 1000.0 : grams;
        } else {
            // à la pièce -> unités attendues en pièces
            amount = (qty == null || qty <= 0) ? 1.0 : qty;
        }

        cartService.addToCart(productId, amount, principal);
        return ResponseEntity.ok().build();
    }

    /**
     * Récupère le panier courant.
     * items: Map<productId, amount> (amount = grammes si au poids, sinon pièces)
     * total: calculé par le service (prix/kg * kg ou prix * pièces)
     */
    @GetMapping("/cart")
    @PreAuthorize("hasAnyRole('CLIENT','ADMIN')")
    public ResponseEntity<Map<String, Object>> getCart(Principal principal) {
        Map<Long, Double> cart = cartService.getCart(principal);
        double total = cartService.getTotal(principal);

        Map<String, Object> response = new HashMap<>();
        response.put("items", cart);
        response.put("total", total);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/cart/{productId}")
    @PreAuthorize("hasAnyRole('CLIENT','ADMIN')")
    public ResponseEntity<?> removeFromCart(@PathVariable Long productId, Principal principal) {
        cartService.removeFromCart(productId, principal);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/cart")
    @PreAuthorize("hasAnyRole('CLIENT','ADMIN')")
    public ResponseEntity<?> clearCart(Principal principal) {
        cartService.clearCart(principal);
        return ResponseEntity.ok().build();
    }
}
