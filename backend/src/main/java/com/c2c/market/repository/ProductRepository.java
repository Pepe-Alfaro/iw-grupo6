package com.c2c.market.repository;

import com.c2c.market.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.ZonedDateTime;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    @Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' AND p.endTime < :now")
    List<Product> findExpiredActiveAuctions(@Param("now") ZonedDateTime now);
}
