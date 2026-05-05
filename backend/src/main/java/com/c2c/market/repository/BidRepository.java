package com.c2c.market.repository;

import com.c2c.market.entity.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BidRepository extends JpaRepository<Bid, Long> {
    Optional<Bid> findTopByProductIdOrderByAmountDesc(Long productId);
}
