package com.example.pat3.services;

import com.example.pat3.entities.Product;
import com.example.pat3.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product productDetails) {
        Optional<Product> product = productRepository.findById(id);
        if (product.isPresent()) {
            Product existingProduct = product.get();
            existingProduct.setName(productDetails.getName());
            existingProduct.setDescription(productDetails.getDescription());
            existingProduct.setPrice(productDetails.getPrice());
            existingProduct.setStock(productDetails.getStock());
            existingProduct.setImageUrl(productDetails.getImageUrl());
            existingProduct.setCategory(productDetails.getCategory());
            return productRepository.save(existingProduct);
        }
        return null;
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    public void updateExpiredProducts() {
        List<Product> products = productRepository.findAll();
        for (Product product : products) {
            if (product.getStock() == 0) { // Critère : stock = 0
                product.setStatus("EXPIRED");
                productRepository.save(product);
            } else if ("EXPIRED".equals(product.getStatus())) { // Réactiver si stock > 0
                product.setStatus("ACTIVE");
                productRepository.save(product);
            }
        }
    }
}