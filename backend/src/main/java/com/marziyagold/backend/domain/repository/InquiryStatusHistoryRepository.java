package com.marziyagold.backend.domain.repository;

import com.marziyagold.backend.domain.entity.InquiryStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InquiryStatusHistoryRepository extends JpaRepository<InquiryStatusHistory, Long> {
}
