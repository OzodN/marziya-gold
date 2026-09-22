package com.marziyagold.backend.api.dto.request;

import java.util.List;

public class InquiryRequestDTO {
    private String clientName;
    private String clientPhone;
    private String clientComment;
    private List<InquiryItemRequestDTO> items;

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getClientPhone() { return clientPhone; }
    public void setClientPhone(String clientPhone) { this.clientPhone = clientPhone; }

    public String getClientComment() { return clientComment; }
    public void setClientComment(String clientComment) { this.clientComment = clientComment; }

    public List<InquiryItemRequestDTO> getItems() { return items; }
    public void setItems(List<InquiryItemRequestDTO> items) { this.items = items; }

    public static class InquiryItemRequestDTO {
        private Long productId;
        private Integer quantity;

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }
}
