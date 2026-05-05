package com.c2c.market.service;

import com.c2c.market.entity.Transaction;
import com.c2c.market.entity.Product;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    public void notifyAuctionWinner(Transaction transaction) {}
    public void notifyAuctionSeller(Transaction transaction) {}
    public void notifyAuctionNoBids(Product auction) {}
}
