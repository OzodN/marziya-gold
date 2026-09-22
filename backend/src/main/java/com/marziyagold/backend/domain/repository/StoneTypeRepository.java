package com.marziyagold.backend.domain.repository;

import com.marziyagold.backend.domain.entity.StoneType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoneTypeRepository extends JpaRepository<StoneType, Long> {
}