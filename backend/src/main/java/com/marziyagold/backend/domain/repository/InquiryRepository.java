package com.marziyagold.backend.domain.repository;

import com.marziyagold.backend.domain.entity.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
}
