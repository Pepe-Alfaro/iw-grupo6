package com.c2c.market.service;

import com.c2c.market.entity.Product;
import com.c2c.market.entity.Bid;
import com.c2c.market.entity.Transaction;
import com.c2c.market.repository.ProductRepository;
import com.c2c.market.repository.BidRepository;
import com.c2c.market.repository.TransactionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AuctionSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(AuctionSchedulerService.class);

    private final ProductRepository productRepository;
    private final BidRepository bidRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;

    @Autowired
    public AuctionSchedulerService(ProductRepository productRepository, 
                                   BidRepository bidRepository, 
                                   TransactionRepository transactionRepository,
                                   NotificationService notificationService) {
        this.productRepository = productRepository;
        this.bidRepository = bidRepository;
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
    }

    /**
     * Tarea programada que se ejecuta cada minuto para resolver subastas finalizadas.
     */
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void resolveExpiredAuctions() {
        logger.info("Iniciando el proceso de adjudicación automática de subastas...");

        ZonedDateTime now = ZonedDateTime.now();
        // Recuperar productos tipo AUCTION, en estado ACTIVE, cuya end_time haya pasado
        List<Product> expiredAuctions = productRepository.findExpiredActiveAuctions(now);

        for (Product auction : expiredAuctions) {
            try {
                processAuction(auction);
            } catch (Exception e) {
                logger.error("Error al procesar la subasta ID: " + auction.getId(), e);
                // Manejo individual para no detener el batch completo
            }
        }
        
        logger.info("Proceso de adjudicación completado.");
    }

    /**
     * Procesa una única subasta finalizada, manejando la concurrencia a través de @Transactional.
     * Si la subasta no tiene pujas, se cancela o se devuelve.
     * Si tiene pujas, se adjudica al mejor postor.
     */
    @Transactional
    public void processAuction(Product auction) {
        // Bloqueo pesimista/optimista manejado en el repositorio (e.g. @Lock(LockModeType.PESSIMISTIC_WRITE))
        // para evitar "race conditions" con pujas de último segundo.
        
        Optional<Bid> winningBidOpt = bidRepository.findTopByProductIdOrderByAmountDesc(auction.getId());

        if (winningBidOpt.isPresent()) {
            Bid winningBid = winningBidOpt.get();
            
            // Actualizar estado del producto
            auction.setStatus("SOLD");
            productRepository.save(auction);

            // Generar transacción pendiente de pago
            Transaction transaction = new Transaction();
            transaction.setProduct(auction);
            transaction.setBuyer(winningBid.getBidder());
            transaction.setSeller(auction.getSeller());
            transaction.setAmount(winningBid.getAmount());
            transaction.setStatus("PENDING");
            transactionRepository.save(transaction);

            // Notificar al ganador y al vendedor (Spring Mail)
            notificationService.notifyAuctionWinner(transaction);
            notificationService.notifyAuctionSeller(transaction);
            
            logger.info("Subasta {} adjudicada al usuario {} por {}", 
                        auction.getId(), winningBid.getBidder().getId(), winningBid.getAmount());
        } else {
            // Sin pujas, la subasta termina sin adjudicación
            auction.setStatus("CANCELLED");
            productRepository.save(auction);
            
            // Notificar al vendedor
            notificationService.notifyAuctionNoBids(auction);
            
            logger.info("Subasta {} cancelada (sin pujas).", auction.getId());
        }
    }
}
