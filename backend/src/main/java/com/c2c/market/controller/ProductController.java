package com.c2c.market.controller;

import com.c2c.market.entity.Product;
import com.c2c.market.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {

    private final ProductRepository productRepository;

    @Autowired
    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @PostMapping
    public Product createProduct(@RequestBody Product product) {
        product.setStatus("ACTIVE");
        return productRepository.save(product);
    }

    // NUEVO: Funcionalidad de comprar
    @PostMapping("/{id}/buy")
    public ResponseEntity<?> buyProduct(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            if ("SOLD".equals(product.getStatus())) {
                return ResponseEntity.badRequest().body("El producto ya ha sido vendido");
            }
            product.setStatus("SOLD"); // Marcamos como vendido
            productRepository.save(product);
            return ResponseEntity.ok(product);
        }
        return ResponseEntity.notFound().build();
    }

    // NUEVO: Funcionalidad de pujar
    @PostMapping("/{id}/bid")
    public ResponseEntity<?> placeBid(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            if ("SOLD".equals(product.getStatus())) {
                return ResponseEntity.badRequest().body("La subasta ha finalizado");
            }
            
            BigDecimal newBidAmount = new BigDecimal(payload.get("amount"));
            if (newBidAmount.compareTo(product.getCurrentPrice()) <= 0) {
                return ResponseEntity.badRequest().body("La puja debe ser mayor al precio actual");
            }

            product.setCurrentPrice(newBidAmount); // Actualizamos el precio
            productRepository.save(product);
            return ResponseEntity.ok(product);
        }
        return ResponseEntity.notFound().build();
    }
}
