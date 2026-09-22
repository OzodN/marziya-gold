package com.marziyagold.backend.domain.repository;

import com.marziyagold.backend.domain.entity.ProductStone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductStoneRepository extends JpaRepository<ProductStone, Long> {
    List<ProductStone> findByProductId(Long productId);
}
