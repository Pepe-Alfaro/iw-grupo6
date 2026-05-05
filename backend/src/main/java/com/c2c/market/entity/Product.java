package com.c2c.market.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "products")
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;

    @Column(name = "condition")
    private String condition; // NEW, USED

    @Column(name = "sale_type")
    private String saleType; // FIXED_PRICE, AUCTION

    @Column(name = "base_price")
    private BigDecimal basePrice;

    @Column(name = "current_price")
    private BigDecimal currentPrice;

    private String status; // ACTIVE, SOLD, CANCELLED

    @Column(name = "end_time")
    private ZonedDateTime endTime;

    @ManyToOne
    @JoinColumn(name = "seller_id")
    private User seller;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }

    public String getSaleType() { return saleType; }
    public void setSaleType(String saleType) { this.saleType = saleType; }

    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }

    public BigDecimal getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(BigDecimal currentPrice) { this.currentPrice = currentPrice; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public ZonedDateTime getEndTime() { return endTime; }
    public void setEndTime(ZonedDateTime endTime) { this.endTime = endTime; }

    public User getSeller() { return seller; }
    public void setSeller(User seller) { this.seller = seller; }
}
