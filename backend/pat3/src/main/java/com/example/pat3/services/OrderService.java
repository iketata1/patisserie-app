package com.example.pat3.services;

import com.example.pat3.entities.Order;
import com.example.pat3.entities.Product;
import com.example.pat3.events.OrderStatusEvent;
import com.example.pat3.repository.OrderRepository;
import com.example.pat3.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Order saveOrder(Order order) {
        if (order == null) throw new IllegalArgumentException("Order is null");

        order.setOrderDate(LocalDateTime.now());

        List<Product> requestedProducts = order.getProducts() != null
                ? order.getProducts()
                : Collections.emptyList();

        if (requestedProducts.isEmpty()) {
            throw new RuntimeException("La commande ne contient aucun produit");
        }

        List<Product> productsToPersistInOrder = new ArrayList<>();

        for (Product productReq : requestedProducts) {
            if (productReq.getId() == null) {
                throw new RuntimeException("Produit sans ID dans la commande");
            }

            Product existingProduct = productRepository.findById(productReq.getId())
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé avec ID: " + productReq.getId()));

            // Quantité demandée (nullable -> défaut 1.0 pièce si non weightBased, 1000g si weightBased ?)
            // Ici on garde ton choix : défaut 1.0 (pièce) ou 1000g si poids ? On privilégie ce qui vient du front.
            double qtyRequested = (productReq.getQuantity() != null) ? productReq.getQuantity() : 1.0;

            Double currentStock = existingProduct.getStock() != null ? existingProduct.getStock() : 0.0;
            boolean byWeight = Boolean.TRUE.equals(existingProduct.getWeightBased());

            if (byWeight) {
                // qtyRequested exprimée en grammes -> convert to kg
                double requestedKg = qtyRequested / 1000.0;
                if (currentStock < requestedKg) {
                    throw new RuntimeException(
                            "Stock insuffisant pour " + existingProduct.getName()
                                    + ". Stock restant : " + currentStock + " kg"
                    );
                }
                double newStock = currentStock - requestedKg;
                newStock = Math.max(0, Math.round(newStock * 1000.0) / 1000.0); // 3 décimales
                existingProduct.setStock(newStock);
            } else {
                // produit en pièces
                if (currentStock < qtyRequested) {
                    throw new RuntimeException(
                            "Stock insuffisant pour " + existingProduct.getName()
                                    + ". Stock restant : " + currentStock + " pièces"
                    );
                }
                double newStock = currentStock - qtyRequested;
                // si tu veux forcer entier: newStock = Math.floor(newStock);
                existingProduct.setStock(newStock);
            }

            productRepository.save(existingProduct);
            productsToPersistInOrder.add(existingProduct);
        }

        order.setProducts(productsToPersistInOrder);

        // (Re)calcul du total uniquement si non fourni ou <= 0
        if (order.getTotal() == null || order.getTotal() <= 0) {
            double total = 0.0;
            for (int i = 0; i < requestedProducts.size(); i++) {
                Product req = requestedProducts.get(i);      // contient la quantity demandée
                Product persisted = productsToPersistInOrder.get(i);

                double price = persisted.getPrice() != null ? persisted.getPrice() : 0.0;
                double qty = (req.getQuantity() != null) ? req.getQuantity() : 1.0;

                if (Boolean.TRUE.equals(persisted.getWeightBased())) {
                    // qty en grammes → prix/kg * (g / 1000)
                    total += price * (qty / 1000.0);
                } else {
                    // qty en pièces → prix * qty
                    total += price * qty;
                }
            }
            total = Math.round(total * 1000.0) / 1000.0; // 3 décimales
            order.setTotal(total);
        }

        if (order.getStatus() == null || order.getStatus().isBlank()) {
            order.setStatus("PENDING");
        }

        if (order.getBuyerDetails() != null) {
            order.setBuyerDetails(new Order.BuyerDetails(
                    order.getBuyerDetails().getName(),
                    order.getBuyerDetails().getSurname(),
                    order.getBuyerDetails().getPhone(),
                    order.getBuyerDetails().getAddress()
            ));
        }

        return orderRepository.save(order);
    }

    private static final Map<String, List<String>> VALID_TRANSITIONS = Map.of(
            "PENDING", List.of("ACCEPTED", "CANCELED"),
            "ACCEPTED", List.of("IN_DELIVERY", "CANCELED"),
            "IN_DELIVERY", List.of("DELIVERED", "CANCELED"),
            "CANCELED", List.of("PENDING"),
            "DELIVERED", List.of()
    );
    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAllWithProducts();
    }

    @Transactional(readOnly = true)
    public List<Order> getClientOrders(String username) {
        return orderRepository.findAllByBuyerNameWithProducts(username);
    }
    private boolean isValidStatusTransition(String currentStatus, String newStatus) {
        List<String> validNextStatuses = VALID_TRANSITIONS.getOrDefault(currentStatus, List.of());
        return validNextStatuses.contains(newStatus);
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, String newStatus, String comment) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        String previous = order.getStatus();
        if (!isValidStatusTransition(previous, newStatus)) {
            throw new SecurityException("Transition interdite de " + previous + " à " + newStatus);
        }

        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);

        // Broadcast temps réel
        OrderStatusEvent evt = new OrderStatusEvent(
                saved.getId(), newStatus, previous, "admin", LocalDateTime.now()
        );
        messagingTemplate.convertAndSend("/topic/orders/status", evt);
        messagingTemplate.convertAndSend("/topic/orders/" + saved.getId(), evt);

        return saved;
    }


}
