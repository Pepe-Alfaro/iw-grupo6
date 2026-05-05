package com.c2c.market.config;

import com.c2c.market.entity.Product;
import com.c2c.market.entity.User;
import com.c2c.market.repository.ProductRepository;
import com.c2c.market.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner loadData(UserRepository userRepository, ProductRepository productRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                User demoUser = new User();
                demoUser.setUsername("demo_seller");
                demoUser.setEmail("demo@c2c.com");
                demoUser.setPasswordHash("dummy_hash");
                demoUser.setRole("CLIENT");
                userRepository.save(demoUser);

                User moderatorUser = new User();
                moderatorUser.setUsername("moderator");
                moderatorUser.setEmail("mod@c2c.com");
                moderatorUser.setPasswordHash("dummy_hash");
                moderatorUser.setRole("MODERATOR");
                userRepository.save(moderatorUser);

                Product p1 = new Product();
                p1.setTitle("MacBook Pro M2");
                p1.setDescription("Casi nuevo, poco uso.");
                p1.setCondition("USED");
                p1.setSaleType("AUCTION");
                p1.setBasePrice(new BigDecimal("800.00"));
                p1.setCurrentPrice(new BigDecimal("850.00"));
                p1.setStatus("ACTIVE");
                p1.setEndTime(ZonedDateTime.now().plusHours(2));
                p1.setSeller(demoUser);
                p1.setImageUrl("https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=60");
                productRepository.save(p1);

                Product p2 = new Product();
                p2.setTitle("Auriculares Sony XM5");
                p2.setDescription("Nuevos, precintados.");
                p2.setCondition("NEW");
                p2.setSaleType("FIXED_PRICE");
                p2.setBasePrice(new BigDecimal("280.00"));
                p2.setCurrentPrice(new BigDecimal("280.00"));
                p2.setStatus("ACTIVE");
                p2.setSeller(demoUser);
                p2.setImageUrl("https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=500&q=60");
                productRepository.save(p2);
            }
        };
    }
}
