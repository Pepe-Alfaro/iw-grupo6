package com.c2c.market;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class C2cMarketApplication {
    public static void main(String[] args) {
        SpringApplication.run(C2cMarketApplication.class, args);
    }
}
