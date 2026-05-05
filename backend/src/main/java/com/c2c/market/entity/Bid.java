package com.c2c.market.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "bids")
public class Bid {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private BigDecimal amount;
    @ManyToOne
    private User bidder;
    @ManyToOne
    private Product product;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public User getBidder() { return bidder; }
    public void setBidder(User bidder) { this.bidder = bidder; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
}
