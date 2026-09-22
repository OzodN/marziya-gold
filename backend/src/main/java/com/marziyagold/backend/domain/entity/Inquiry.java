package com.marziyagold.backend.domain.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inquiry")
public class Inquiry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_name", nullable = false)
    private String clientName;

    @Column(name = "client_phone", nullable = false, length = 100)
    private String clientPhone;

    @Column(name = "client_comment", columnDefinition = "TEXT")
    private String clientComment;

    @Column(nullable = false, length = 50)
    private String status = "NEW";

    @OneToMany(mappedBy = "inquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InquiryItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "inquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InquiryStatusHistory> statusHistories = new ArrayList<>();

    @Column(name = "created_at", updatable = false, insertable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false)
    private OffsetDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getClientPhone() { return clientPhone; }
    public void setClientPhone(String clientPhone) { this.clientPhone = clientPhone; }

    public String getClientComment() { return clientComment; }
    public void setClientComment(String clientComment) { this.clientComment = clientComment; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<InquiryItem> getItems() { return items; }
    public void setItems(List<InquiryItem> items) { this.items = items; }

    public List<InquiryStatusHistory> getStatusHistories() { return statusHistories; }
    public void setStatusHistories(List<InquiryStatusHistory> statusHistories) { this.statusHistories = statusHistories; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
