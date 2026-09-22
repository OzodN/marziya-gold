package com.marziyagold.backend.domain.repository;

import com.marziyagold.backend.domain.entity.InquiryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InquiryItemRepository extends JpaRepository<InquiryItem, Long> {
}
