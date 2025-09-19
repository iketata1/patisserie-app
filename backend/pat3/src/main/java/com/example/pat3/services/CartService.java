package com.example.pat3.services;

import com.example.pat3.entities.Product;
import com.example.pat3.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@Service
public class CartService {

    @Autowired
    private ProductRepository productRepository;

    // ✅ Map utilisateur → (productId → quantité (Double))
    // quantité = grammes si weightBased, sinon nombre de pièces
    private Map<String, Map<Long, Double>> userCarts = new HashMap<>();

    public void addToCart(Long productId, double amount, Principal principal) {
        String username = principal.getName();
        Map<Long, Double> cart = userCarts.computeIfAbsent(username, k -> new HashMap<>());
        double current = cart.getOrDefault(productId, 0.0);
        cart.put(productId, current + amount); // accumulate en grammes ou pièces
    }

    public Map<Long, Double> getCart(Principal principal) {
        String username = principal.getName();
        return userCarts.getOrDefault(username, new HashMap<>());
    }

    public void clearCart(Principal principal) {
        String username = principal.getName();
        userCarts.remove(username);
    }

    public void removeFromCart(Long productId, Principal principal) {
        String username = principal.getName();
        Map<Long, Double> cart = userCarts.get(username);
        if (cart != null) {
            cart.remove(productId);
            if (cart.isEmpty()) {
                userCarts.remove(username);
            }
        }
    }

    // ✅ TOTAL = Σ (prix/kg * grams/1000) si au poids
    //           Σ (prix * quantité) si à la pièce
    public double getTotal(Principal principal) {
        Map<Long, Double> cart = getCart(principal);
        return cart.entrySet().stream()
                .mapToDouble(entry -> {
                    Product p = productRepository.findById(entry.getKey())
                            .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

                    double amount = entry.getValue();
                    if (Boolean.TRUE.equals(p.getWeightBased())) {
                        // Produit au poids → prix/kg * (grams / 1000)
                        return p.getPrice() * (amount / 1000.0);
                    } else {
                        // Produit à la pièce → prix * qty
                        return p.getPrice() * amount;
                    }
                })
                .sum();
    }
}
