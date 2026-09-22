package com.marziyagold.backend.api.controller.public_api;

import com.marziyagold.backend.api.dto.request.InquiryRequestDTO;
import com.marziyagold.backend.service.InquiryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/inquiries")
public class InquiryController {

    private final InquiryService inquiryService;

    public InquiryController(InquiryService inquiryService) {
        this.inquiryService = inquiryService;
    }

    @PostMapping
    public ResponseEntity<Void> submitInquiry(@RequestBody InquiryRequestDTO request) {
        inquiryService.createInquiry(request);
        return ResponseEntity.ok().build();
    }
}
