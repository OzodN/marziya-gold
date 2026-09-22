package com.marziyagold.backend.api.controller.public_api;

import com.marziyagold.backend.domain.entity.Product;
import com.marziyagold.backend.domain.repository.ProductRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public/products")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> listProducts() {
        return productRepository.findAllByDeletedFalseAndVisibleTrue();
    }
}