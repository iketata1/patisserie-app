package com.example.pat3.controller;

import com.example.pat3.entities.Order;
import com.example.pat3.entities.Product;
import com.example.pat3.entities.User;
import com.example.pat3.services.OrderService;
import com.example.pat3.services.ProductService;
import com.example.pat3.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.util.*;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api")
public class ProductController {

    @Autowired
    private ProductService productService;
    @Autowired
    private OrderService orderService;
    @Autowired
    private UserService userService;

    @Value("${app.upload-dir}")
    private String uploadDir;

    // ===================== ORDERS ===================== //

    @GetMapping("/client/orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')")
    public ResponseEntity<List<Order>> getClientOrders(Principal principal) {
        String username = principal.getName();
        List<Order> orders = orderService.getClientOrders(username);
        return ResponseEntity.ok(orders);
    }
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/orders")
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(@RequestBody Order order) {
        try {
            Order savedOrder = orderService.saveOrder(order);
            return ResponseEntity.ok(savedOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Échec de la commande : " + e.getMessage()));
        }
    }

    @PutMapping("/orders/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> statusUpdate) {
        String newStatus = statusUpdate.get("status");
        String comment = statusUpdate.get("comment");
        try {
            Order updated = orderService.updateOrderStatus(orderId, newStatus, comment);
            // Réponse légère -> pas de lazy serialize
            return ResponseEntity.ok(Map.of(
                    "id", updated.getId(),
                    "status", updated.getStatus()
            ));
            // // Variante:
            // return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }


    // ===================== PRODUCTS ===================== //

    @GetMapping("/products")
    public List<Product> getAllProducts(@RequestParam(required = false) String category) {
        if (category != null && !category.isEmpty()) {
            return productService.getProductsByCategory(category);
        }
        return productService.getAllProducts();
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/products")
    @PreAuthorize("hasRole('ADMIN')")

    public ResponseEntity<Product> createProduct(
            @RequestPart("product") Product product,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {

        if (image != null && !image.isEmpty()) {
            String fileName = UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
            Path filePath = Paths.get(uploadDir, fileName);
            Files.createDirectories(filePath.getParent());
            Files.write(filePath, image.getBytes());

            // ✅ Toujours utiliser le préfixe "/uploads/"
            product.setImageUrl("/uploads/" + fileName);
            System.out.println("Image uploaded and saved at: " + filePath);
        }

        Product savedProduct = productService.createProduct(product);
        return ResponseEntity.ok(savedProduct);
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable Long id,
            @RequestPart("product") Product productDetails,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {

        if (image != null && !image.isEmpty()) {
            String fileName = UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
            Path filePath = Paths.get(uploadDir, fileName);
            Files.createDirectories(filePath.getParent());
            Files.write(filePath, image.getBytes());

            // ✅ Uniformisation de l’URL
            productDetails.setImageUrl("/uploads/" + fileName);
        }

        Product updatedProduct = productService.updateProduct(id, productDetails);
        return updatedProduct != null ? ResponseEntity.ok(updatedProduct) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    // 🔧 ICI la correction : quantity en double pour matcher setQuantity(Double)
    @PutMapping("/products/{id}/quantity")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> updateProductQuantity(@PathVariable Long id,
                                                         @RequestParam double quantity) {
        return productService.getProductById(id)
                .map(p -> {
                    p.setQuantity(quantity); // autoboxing vers Double
                    return ResponseEntity.ok(productService.updateProduct(id, p));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/update-expired")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> updateExpiredProducts() {
        productService.updateExpiredProducts();
        return ResponseEntity.ok("Statuts des produits mis à jour avec succès.");
    }

    // ===================== DASHBOARD ===================== //

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')")
    public ResponseEntity<Map<String, Object>> getDashboardData(Principal principal) {
        String username = principal.getName();
        String role = getUserRole(username);
        Map<String, Object> response = new HashMap<>();

        if ("ADMIN".equals(role)) {
            response.put("products", productService.getAllProducts());
            response.put("orders", orderService.getAllOrders());
        } else if ("CLIENT".equals(role)) {
            response.put("orders", orderService.getAllOrders().stream()
                    .filter(order -> order.getBuyerDetails() != null
                            && username.equals(order.getBuyerDetails().getName()))
                    .toList());
        }
        return ResponseEntity.ok(response);
    }

    private String getUserRole(String username) {
        User user = userService.findByUsername(username);
        return user != null && user.getRoles().contains("ADMIN") ? "ADMIN" : "CLIENT";
    }

    // ===================== Error DTO ===================== //

    static class ErrorResponse {
        private final String message;
        public ErrorResponse(String message) { this.message = message; }
        public String getMessage() { return message; }
    }
}
