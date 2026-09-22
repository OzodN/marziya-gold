package com.marziyagold.backend.service;

import com.marziyagold.backend.api.dto.request.InquiryRequestDTO;
import com.marziyagold.backend.domain.entity.*;
import com.marziyagold.backend.domain.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final ProductRepository productRepository;
    private final ProductStoneRepository productStoneRepository;
    private final ProductImageRepository productImageRepository;

    public InquiryService(InquiryRepository inquiryRepository,
                          ProductRepository productRepository,
                          ProductStoneRepository productStoneRepository,
                          ProductImageRepository productImageRepository) {
        this.inquiryRepository = inquiryRepository;
        this.productRepository = productRepository;
        this.productStoneRepository = productStoneRepository;
        this.productImageRepository = productImageRepository;
    }

    @Transactional
    public Inquiry createInquiry(InquiryRequestDTO request) {
        Inquiry inquiry = new Inquiry();
        inquiry.setClientName(request.getClientName());
        inquiry.setClientPhone(request.getClientPhone());
        inquiry.setClientComment(request.getClientComment());
        inquiry.setStatus("NEW");

        if (request.getItems() != null) {
            for (InquiryRequestDTO.InquiryItemRequestDTO itemDto : request.getItems()) {
                Product product = productRepository.findById(itemDto.getProductId())
                        .orElseThrow(() -> new IllegalArgumentException("Product not found: " + itemDto.getProductId()));

                if (Boolean.TRUE.equals(product.getDeleted())) {
                    throw new IllegalArgumentException("Product is deleted: " + itemDto.getProductId());
                }
                if (Boolean.FALSE.equals(product.getVisible())) {
                    throw new IllegalArgumentException("Product is not visible: " + itemDto.getProductId());
                }

                InquiryItem item = new InquiryItem();
                item.setInquiry(inquiry);
                item.setProduct(product);
                item.setQuantity(itemDto.getQuantity());

                Map<String, Object> snapshot = createSnapshot(product);
                item.setSnapshotData(snapshot);

                inquiry.getItems().add(item);
            }
        }

        // Add initial status history
        InquiryStatusHistory history = new InquiryStatusHistory();
        history.setInquiry(inquiry);
        history.setNewStatus("NEW");
        inquiry.getStatusHistories().add(history);

        return inquiryRepository.save(inquiry);
    }

    private Map<String, Object> createSnapshot(Product product) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("sku", product.getSku());
        snapshot.put("name", product.getName());
        snapshot.put("description", product.getDescription());
        
        if (product.getCategory() != null) {
            Map<String, Object> categoryInfo = new HashMap<>();
            categoryInfo.put("id", product.getCategory().getId());
            categoryInfo.put("name", product.getCategory().getName());
            snapshot.put("category", categoryInfo);
        }

        snapshot.put("characteristics", product.getCharacteristics());

        List<ProductStone> stones = productStoneRepository.findByProductId(product.getId());
        List<Map<String, Object>> stonesSnapshot = stones.stream().map(stone -> {
            Map<String, Object> s = new HashMap<>();
            s.put("characteristics", stone.getCharacteristics());
            if (stone.getStoneType() != null) {
                s.put("stoneTypeName", stone.getStoneType().getName());
            }
            return s;
        }).collect(Collectors.toList());
        snapshot.put("stones", stonesSnapshot);

        List<ProductImage> images = productImageRepository.findByProductId(product.getId());
        List<String> imageFiles = images.stream()
                .map(img -> img.getFileIdentifier().toString())
                .collect(Collectors.toList());
        snapshot.put("images", imageFiles);

        return snapshot;
    }
}
