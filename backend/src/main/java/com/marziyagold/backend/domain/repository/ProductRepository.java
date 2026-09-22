package com.marziyagold.backend.domain.repository;

import com.marziyagold.backend.domain.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findAllByDeletedFalseAndVisibleTrue();
}