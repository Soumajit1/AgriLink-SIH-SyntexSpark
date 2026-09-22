-- =====================================================
-- AgriLink AI - Complete Database Schema & Seed Data
-- Generated: 2026-09-21T09:30:03.143Z
-- =====================================================

CREATE DATABASE IF NOT EXISTS `agrilink_ai` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `agrilink_ai`;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- Table: buyer_details
-- -----------------------------------------------------
DROP TABLE IF EXISTS `buyer_details`;
CREATE TABLE `buyer_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `company_name` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `buyer_details_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table: disputes
-- -----------------------------------------------------
DROP TABLE IF EXISTS `disputes`;
CREATE TABLE `disputes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_code` varchar(50) NOT NULL,
  `transaction_id` int NOT NULL,
  `raised_by_id` int NOT NULL,
  `against_id` int NOT NULL,
  `issue_type` varchar(100) NOT NULL,
  `description` text,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `status` enum('open','under_review','resolved','dismissed') DEFAULT 'open',
  `resolution` text,
  `resolved_by_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_code` (`ticket_code`),
  KEY `idx_txn` (`transaction_id`),
  KEY `idx_raised` (`raised_by_id`),
  KEY `idx_against` (`against_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for: disputes
INSERT INTO `disputes` (`id`, `ticket_code`, `transaction_id`, `raised_by_id`, `against_id`, `issue_type`, `description`, `priority`, `status`, `resolution`, `resolved_by_id`, `created_at`, `resolved_at`) VALUES (1, 'TKT-1042', 1, 5, 4, 'Quality Mismatch', 'Produce delivered was lower grade than agreed sample.', 'high', 'resolved', 'After verifing ur proof, we inticiate your compaansation.', NULL, '2026-09-18 19:29:16', '2026-09-18 20:24:12');
INSERT INTO `disputes` (`id`, `ticket_code`, `transaction_id`, `raised_by_id`, `against_id`, `issue_type`, `description`, `priority`, `status`, `resolution`, `resolved_by_id`, `created_at`, `resolved_at`) VALUES (2, 'TKT-1038', 2, 5, 4, 'Late Delivery', 'Shipment was delayed by 3 days due to transport strike.', 'medium', 'resolved', 'Mutual agreement reached: Buyer granted 5% discount settlement.', NULL, '2026-09-18 19:29:16', '2026-09-18 19:29:16');
INSERT INTO `disputes` (`id`, `ticket_code`, `transaction_id`, `raised_by_id`, `against_id`, `issue_type`, `description`, `priority`, `status`, `resolution`, `resolved_by_id`, `created_at`, `resolved_at`) VALUES (3, 'TKT-1081', 6, 12, 5, 'Late Delivery', 'Transporter was delayed by 48 hours.', 'medium', 'resolved', 'Famrmar says it will be not happend from next time.', NULL, '2026-09-18 19:31:00', '2026-09-18 20:23:36');
INSERT INTO `disputes` (`id`, `ticket_code`, `transaction_id`, `raised_by_id`, `against_id`, `issue_type`, `description`, `priority`, `status`, `resolution`, `resolved_by_id`, `created_at`, `resolved_at`) VALUES (4, 'TKT-3258', 8, 5, 12, 'Payment Delay', 'Bank server timeout delayed the automated escrow release.', 'medium', 'resolved', 'Bank transfer verified and released to farmer. Dispute settled amicably.', NULL, '2026-09-18 19:39:33', '2026-09-18 19:40:29');
INSERT INTO `disputes` (`id`, `ticket_code`, `transaction_id`, `raised_by_id`, `against_id`, `issue_type`, `description`, `priority`, `status`, `resolution`, `resolved_by_id`, `created_at`, `resolved_at`) VALUES (5, 'TKT-8360', 10, 12, 15, 'Payment Delay', 'Payment Dealy', 'medium', 'resolved', 'Payment Disbusted.', NULL, '2026-09-18 19:55:42', '2026-09-18 20:23:02');
INSERT INTO `disputes` (`id`, `ticket_code`, `transaction_id`, `raised_by_id`, `against_id`, `issue_type`, `description`, `priority`, `status`, `resolution`, `resolved_by_id`, `created_at`, `resolved_at`) VALUES (6, 'TKT-1234', 12, 16, 9, 'Payment Delay', 'Payment Delay', 'high', 'open', NULL, NULL, '2026-09-19 11:40:54', NULL);
INSERT INTO `disputes` (`id`, `ticket_code`, `transaction_id`, `raised_by_id`, `against_id`, `issue_type`, `description`, `priority`, `status`, `resolution`, `resolved_by_id`, `created_at`, `resolved_at`) VALUES (7, 'TKT-5005', 14, 17, 9, 'Payment Delay', 'NA', 'medium', 'resolved', 'Payment clear.', NULL, '2026-09-20 14:41:02', '2026-09-20 14:47:06');

-- -----------------------------------------------------
-- Table: farmer_details
-- -----------------------------------------------------
DROP TABLE IF EXISTS `farmer_details`;
CREATE TABLE `farmer_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `village` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `farmer_details_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table: fpo_details
-- -----------------------------------------------------
DROP TABLE IF EXISTS `fpo_details`;
CREATE TABLE `fpo_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `organization_name` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fpo_details_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table: market_prices
-- -----------------------------------------------------
DROP TABLE IF EXISTS `market_prices`;
CREATE TABLE `market_prices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `crop_name` varchar(100) NOT NULL,
  `market_name` varchar(150) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `price_per_kg` decimal(10,2) NOT NULL,
  `price_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table: notifications
-- -----------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for: notifications
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (1, 12, 'Dispute Raised', 'Your dispute (TKT-1081) has been submitted and is under admin review.', 'warning', 0, '2026-09-18 19:31:00');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (2, 5, 'Dispute Filed Against Transaction', 'A dispute (TKT-1081) has been raised regarding Transaction #6. Admin will review shortly.', 'warning', 0, '2026-09-18 19:31:00');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (3, 5, 'New Trust Score Rating Received', 'You received a 5-star review on Transaction #6!', 'info', 0, '2026-09-18 19:31:00');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (4, 5, 'Account Status Updated', 'Your AgriLink AI account status has been updated to: ACTIVE.', 'warning', 0, '2026-09-18 19:31:00');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (5, 13, 'New Trust Score Rating Received', 'You received a 5-star review on Transaction #9!', 'info', 0, '2026-09-18 19:39:16');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (6, 5, 'Dispute Raised', 'Your dispute (TKT-3258) has been submitted and is under admin review.', 'warning', 0, '2026-09-18 19:39:33');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (7, 12, 'Dispute Filed Against Transaction', 'A dispute (TKT-3258) has been raised regarding Transaction #8. Admin will review shortly.', 'warning', 0, '2026-09-18 19:39:33');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (8, 5, 'Dispute Updated', 'Dispute ticket TKT-3258 status has been updated to RESOLVED. Resolution: Bank transfer verified and released to farmer. Dispute settled amicably.', 'info', 0, '2026-09-18 19:40:29');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (9, 12, 'Dispute Updated', 'Dispute ticket TKT-3258 status has been updated to RESOLVED. Resolution: Bank transfer verified and released to farmer. Dispute settled amicably.', 'info', 0, '2026-09-18 19:40:29');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (11, 5, 'New Trust Score Rating Received', 'You received a 5-star review on Transaction #7!', 'info', 0, '2026-09-18 19:44:55');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (12, 12, 'Dispute Raised', 'Your dispute (TKT-8360) has been submitted and is under admin review.', 'warning', 0, '2026-09-18 19:55:42');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (13, 15, 'Dispute Filed Against Transaction', 'A dispute (TKT-8360) has been raised regarding Transaction #10. Admin will review shortly.', 'warning', 0, '2026-09-18 19:55:42');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (14, 12, 'Dispute Updated', 'Dispute ticket TKT-8360 status has been updated to RESOLVED. Resolution: Payment Disbusted.', 'info', 0, '2026-09-18 20:23:01');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (15, 15, 'Dispute Updated', 'Dispute ticket TKT-8360 status has been updated to RESOLVED. Resolution: Payment Disbusted.', 'info', 0, '2026-09-18 20:23:01');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (16, 12, 'Dispute Updated', 'Dispute ticket TKT-1081 status has been updated to RESOLVED. Resolution: Famrmar says it will be not happend from next time.', 'info', 0, '2026-09-18 20:23:36');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (17, 5, 'Dispute Updated', 'Dispute ticket TKT-1081 status has been updated to RESOLVED. Resolution: Famrmar says it will be not happend from next time.', 'info', 0, '2026-09-18 20:23:36');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (18, 5, 'Dispute Updated', 'Dispute ticket TKT-1042 status has been updated to RESOLVED. Resolution: After verifing ur proof, we inticiate your compaansation.', 'info', 0, '2026-09-18 20:24:11');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (19, 4, 'Dispute Updated', 'Dispute ticket TKT-1042 status has been updated to RESOLVED. Resolution: After verifing ur proof, we inticiate your compaansation.', 'info', 0, '2026-09-18 20:24:11');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (20, 12, 'New Trust Score Rating Received', 'You received a 5-star review on Transaction #7!', 'info', 0, '2026-09-18 20:29:11');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (21, 16, 'Dispute Raised', 'Your dispute (TKT-1234) has been submitted and is under admin review.', 'warning', 0, '2026-09-19 11:40:54');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (22, 9, 'Dispute Filed Against Transaction', 'A dispute (TKT-1234) has been raised regarding Transaction #12. Admin will review shortly.', 'warning', 0, '2026-09-19 11:40:54');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (23, 17, 'Dispute Raised', 'Your dispute (TKT-5005) has been submitted and is under admin review.', 'warning', 0, '2026-09-20 14:41:02');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (24, 9, 'Dispute Filed Against Transaction', 'A dispute (TKT-5005) has been raised regarding Transaction #14. Admin will review shortly.', 'warning', 0, '2026-09-20 14:41:02');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (25, 17, 'Dispute Updated', 'Dispute ticket TKT-5005 status has been updated to RESOLVED. Resolution: Payment clear.', 'info', 0, '2026-09-20 14:47:06');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES (26, 9, 'Dispute Updated', 'Dispute ticket TKT-5005 status has been updated to RESOLVED. Resolution: Payment clear.', 'info', 0, '2026-09-20 14:47:06');

-- -----------------------------------------------------
-- Table: offers
-- -----------------------------------------------------
DROP TABLE IF EXISTS `offers`;
CREATE TABLE `offers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `produce_id` int NOT NULL,
  `buyer_id` int NOT NULL,
  `offered_price` decimal(10,2) NOT NULL,
  `buyer_offer_price` decimal(10,2) DEFAULT NULL,
  `counter_price` decimal(10,2) DEFAULT NULL,
  `final_price` decimal(10,2) DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `message` text,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `produce_id` (`produce_id`),
  KEY `buyer_id` (`buyer_id`),
  CONSTRAINT `offers_ibfk_1` FOREIGN KEY (`produce_id`) REFERENCES `produce_listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `offers_ibfk_2` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for: offers
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (1, 1, 5, '23.00', '20.00', '23.00', '20.00', '5.00', 'I WANT 20/KG', 'accepted', '2026-09-06 09:48:56');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (2, 2, 5, '27.00', '25.00', '27.00', '27.00', '56.00', NULL, 'accepted', '2026-09-06 13:17:41');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (3, 1, 9, '23.00', '23.00', NULL, NULL, '20.00', 'na', 'pending', '2026-09-07 13:24:34');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (4, 3, 9, '23.00', '23.00', NULL, '23.00', '20.00', 'na', 'accepted', '2026-09-07 13:24:45');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (5, 4, 9, '28.00', '25.00', '28.00', '28.00', '10.00', 'na', 'accepted', '2026-09-07 13:35:01');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (6, 5, 11, '23.00', '23.00', NULL, '23.00', '30.00', 'NA', 'accepted', '2026-09-17 07:17:39');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (7, 6, 5, '60.00', '60.00', NULL, '60.00', '50.00', NULL, 'accepted', '2026-09-17 09:48:42');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (8, 7, 5, '46.00', '46.00', NULL, '46.00', '8.00', NULL, 'accepted', '2026-09-17 10:11:28');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (9, 7, 5, '50.00', '50.00', NULL, NULL, '2.00', NULL, 'pending', '2026-09-17 11:29:29');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (10, 5, 5, '25.00', '25.00', NULL, '25.00', '6.00', NULL, 'accepted', '2026-09-17 11:29:36');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (11, 8, 5, '28.00', '28.00', NULL, '28.00', '30.00', NULL, 'accepted', '2026-09-17 15:37:34');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (12, 5, 15, '26.00', '25.00', '26.00', '25.00', '14.00', NULL, 'accepted', '2026-09-18 19:48:23');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (13, 7, 15, '50.00', '50.00', NULL, '50.00', '2.00', NULL, 'accepted', '2026-09-18 19:48:30');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (15, 10, 9, '60.00', '60.00', NULL, '60.00', '15.00', 'NA', 'accepted', '2026-09-19 11:39:28');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (16, 9, 9, '35.00', '35.00', NULL, '35.00', '10.00', 'NA', 'accepted', '2026-09-19 11:39:34');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (17, 11, 9, '28.00', '28.00', NULL, '28.00', '15.00', NULL, 'accepted', '2026-09-20 14:38:57');
INSERT INTO `offers` (`id`, `produce_id`, `buyer_id`, `offered_price`, `buyer_offer_price`, `counter_price`, `final_price`, `quantity`, `message`, `status`, `created_at`) VALUES (18, 11, 9, '29.00', '29.00', NULL, '29.00', '5.00', NULL, 'accepted', '2026-09-20 14:57:10');

-- -----------------------------------------------------
-- Table: produce_listings
-- -----------------------------------------------------
DROP TABLE IF EXISTS `produce_listings`;
CREATE TABLE `produce_listings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `farmer_id` int NOT NULL,
  `crop_name` varchar(100) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(20) DEFAULT 'kg',
  `price_per_unit` decimal(10,2) DEFAULT NULL,
  `quality` varchar(50) DEFAULT NULL,
  `description` text,
  `status` enum('available','sold','pending') DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `farmer_id` (`farmer_id`),
  CONSTRAINT `produce_listings_ibfk_1` FOREIGN KEY (`farmer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for: produce_listings
INSERT INTO `produce_listings` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `quality`, `description`, `status`, `created_at`) VALUES (1, 4, 'rice', '45.00', 'kg', '25.00', 'B', 'rice', 'available', '2026-09-06 08:27:41');
INSERT INTO `produce_listings` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `quality`, `description`, `status`, `created_at`) VALUES (2, 4, 'WHEAT', '144.00', 'kg', '29.00', 'A', NULL, 'available', '2026-09-06 13:16:49');
INSERT INTO `produce_listings` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `quality`, `description`, `status`, `created_at`) VALUES (3, 8, 'WHEAT', '30.00', 'kg', '25.00', 'A', '..', 'available', '2026-09-07 13:22:13');
INSERT INTO `produce_listings` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `quality`, `description`, `status`, `created_at`) VALUES (4, 10, 'rice', '10.00', 'kg', '30.00', 'A', 'na', 'available', '2026-09-07 13:34:20');
INSERT INTO `produce_listings` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `quality`, `description`, `status`, `created_at`) VALUES (5, 12, 'Rice', '0.00', 'kg', '25.00', 'A', 'Rice 50 Kg', 'sold', '2026-09-17 07:16:09');
INSERT INTO `produce_listings` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `quality`, `description`, `status`, `created_at`) VALUES (6, 12, 'Wheat', '0.00', 'kg', '60.00', 'B', 'Fresh Wheat 50 Kg.', 'sold', '2026-09-17 09:48:16');
INSERT INTO `produce_listings` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `quality`, `description`, `status`, `created_at`) VALUES (7, 12, 'Dal', '0.00', 'kg', '50.00', 'A', 'Dal', 'sold', '2026-09-17 10:11:04');
INSERT INTO `produce_listings` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `quality`, `description`, `status`, `created_at`) VALUES (8, 13, 'WHEAT', '30.00', 'kg', '30.00', 'A', 'WHEAT 60 kg', 'sold', '2026-09-17 15:35:59');
INSERT INTO `produce_listings` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `quality`, `description`, `status`, `created_at`) VALUES (9, 16, 'Potato', '10.00', 'kg', '35.00', 'A+', 'Premium Quality Potato', 'available', '2026-09-19 11:37:28');
INSERT INTO `produce_listings` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `quality`, `description`, `status`, `created_at`) VALUES (10, 16, 'Suger', '15.00', 'kg', '60.00', 'A', 'Good Quality Suger.', 'available', '2026-09-19 11:37:58');
INSERT INTO `produce_listings` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `quality`, `description`, `status`, `created_at`) VALUES (11, 17, 'Rice', '0.00', 'kg', '30.00', 'A', 'Rice', 'sold', '2026-09-20 14:37:39');

-- -----------------------------------------------------
-- Table: reviews
-- -----------------------------------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_id` int NOT NULL,
  `reviewer_id` int NOT NULL,
  `reviewee_id` int NOT NULL,
  `rating` decimal(2,1) NOT NULL,
  `comment` text,
  `status` enum('published','hidden','flagged') DEFAULT 'published',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_txn_reviewer` (`transaction_id`,`reviewer_id`),
  KEY `idx_reviewee` (`reviewee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for: reviews
INSERT INTO `reviews` (`id`, `transaction_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `status`, `created_at`) VALUES (1, 1, 5, 4, '5.0', 'Excellent crop quality and prompt packaging. Very trustworthy farmer!', 'published', '2026-09-18 19:29:16');
INSERT INTO `reviews` (`id`, `transaction_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `status`, `created_at`) VALUES (2, 1, 4, 5, '4.8', 'Prompt payment on delivery. Great communication throughout!', 'published', '2026-09-18 19:29:16');
INSERT INTO `reviews` (`id`, `transaction_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `status`, `created_at`) VALUES (3, 2, 5, 4, '5.0', 'Excellent crop quality and prompt packaging. Very trustworthy farmer!', 'published', '2026-09-18 19:29:16');
INSERT INTO `reviews` (`id`, `transaction_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `status`, `created_at`) VALUES (4, 2, 4, 5, '4.8', 'Prompt payment on delivery. Great communication throughout!', 'published', '2026-09-18 19:29:16');
INSERT INTO `reviews` (`id`, `transaction_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `status`, `created_at`) VALUES (5, 3, 9, 8, '5.0', 'Excellent crop quality and prompt packaging. Very trustworthy farmer!', 'published', '2026-09-18 19:29:16');
INSERT INTO `reviews` (`id`, `transaction_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `status`, `created_at`) VALUES (6, 3, 8, 9, '4.8', 'Prompt payment on delivery. Great communication throughout!', 'published', '2026-09-18 19:29:16');
INSERT INTO `reviews` (`id`, `transaction_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `status`, `created_at`) VALUES (7, 6, 12, 5, '5.0', 'Super fast payment, great buyer to work with!', 'published', '2026-09-18 19:31:00');
INSERT INTO `reviews` (`id`, `transaction_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `status`, `created_at`) VALUES (8, 9, 5, 13, '5.0', 'Top quality wheat and very quick dispatch by Lakshmi!', 'published', '2026-09-18 19:39:16');
INSERT INTO `reviews` (`id`, `transaction_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `status`, `created_at`) VALUES (9, 7, 12, 5, '5.0', 'Good.', 'published', '2026-09-18 19:44:55');
INSERT INTO `reviews` (`id`, `transaction_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `status`, `created_at`) VALUES (10, 7, 5, 12, '5.0', NULL, 'published', '2026-09-18 20:29:11');

-- -----------------------------------------------------
-- Table: shipments
-- -----------------------------------------------------
DROP TABLE IF EXISTS `shipments`;
CREATE TABLE `shipments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_id` int NOT NULL,
  `pickup_location` varchar(255) DEFAULT NULL,
  `delivery_location` varchar(255) DEFAULT NULL,
  `transporter` varchar(150) DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `status` enum('pending','in_transit','delivered','cancelled') DEFAULT 'pending',
  `estimated_delivery` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `transaction_id` (`transaction_id`),
  CONSTRAINT `shipments_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for: shipments
INSERT INTO `shipments` (`id`, `transaction_id`, `pickup_location`, `delivery_location`, `transporter`, `tracking_number`, `status`, `estimated_delivery`, `created_at`) VALUES (1, 1, NULL, NULL, NULL, NULL, 'delivered', NULL, '2026-09-06 13:27:29');
INSERT INTO `shipments` (`id`, `transaction_id`, `pickup_location`, `delivery_location`, `transporter`, `tracking_number`, `status`, `estimated_delivery`, `created_at`) VALUES (2, 4, NULL, NULL, NULL, NULL, 'pending', NULL, '2026-09-07 13:35:52');
INSERT INTO `shipments` (`id`, `transaction_id`, `pickup_location`, `delivery_location`, `transporter`, `tracking_number`, `status`, `estimated_delivery`, `created_at`) VALUES (3, 6, 'To be confirmed by farmer', 'To be confirmed by buyer', NULL, NULL, 'delivered', NULL, '2026-09-17 10:22:04');
INSERT INTO `shipments` (`id`, `transaction_id`, `pickup_location`, `delivery_location`, `transporter`, `tracking_number`, `status`, `estimated_delivery`, `created_at`) VALUES (4, 8, 'To be confirmed by farmer', 'To be confirmed by buyer', NULL, NULL, 'delivered', NULL, '2026-09-17 11:30:03');
INSERT INTO `shipments` (`id`, `transaction_id`, `pickup_location`, `delivery_location`, `transporter`, `tracking_number`, `status`, `estimated_delivery`, `created_at`) VALUES (5, 9, 'To be confirmed by farmer', 'To be confirmed by buyer', NULL, NULL, 'delivered', NULL, '2026-09-17 15:38:12');
INSERT INTO `shipments` (`id`, `transaction_id`, `pickup_location`, `delivery_location`, `transporter`, `tracking_number`, `status`, `estimated_delivery`, `created_at`) VALUES (6, 10, 'To be confirmed by farmer', 'To be confirmed by buyer', NULL, NULL, 'in_transit', NULL, '2026-09-18 19:55:15');
INSERT INTO `shipments` (`id`, `transaction_id`, `pickup_location`, `delivery_location`, `transporter`, `tracking_number`, `status`, `estimated_delivery`, `created_at`) VALUES (7, 11, 'To be confirmed by farmer', 'To be confirmed by buyer', NULL, NULL, 'pending', NULL, '2026-09-18 20:27:53');
INSERT INTO `shipments` (`id`, `transaction_id`, `pickup_location`, `delivery_location`, `transporter`, `tracking_number`, `status`, `estimated_delivery`, `created_at`) VALUES (8, 12, 'To be confirmed by farmer', 'To be confirmed by buyer', NULL, NULL, 'pending', NULL, '2026-09-19 11:40:15');
INSERT INTO `shipments` (`id`, `transaction_id`, `pickup_location`, `delivery_location`, `transporter`, `tracking_number`, `status`, `estimated_delivery`, `created_at`) VALUES (9, 13, 'To be confirmed by farmer', 'To be confirmed by buyer', NULL, NULL, 'pending', NULL, '2026-09-19 11:40:17');
INSERT INTO `shipments` (`id`, `transaction_id`, `pickup_location`, `delivery_location`, `transporter`, `tracking_number`, `status`, `estimated_delivery`, `created_at`) VALUES (10, 14, 'To be confirmed by farmer', 'To be confirmed by buyer', NULL, NULL, 'delivered', NULL, '2026-09-20 14:39:36');
INSERT INTO `shipments` (`id`, `transaction_id`, `pickup_location`, `delivery_location`, `transporter`, `tracking_number`, `status`, `estimated_delivery`, `created_at`) VALUES (11, 15, 'To be confirmed by farmer', 'To be confirmed by buyer', NULL, NULL, 'pending', NULL, '2026-09-20 14:57:55');

-- -----------------------------------------------------
-- Table: transactions
-- -----------------------------------------------------
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `offer_id` int NOT NULL,
  `farmer_id` int NOT NULL,
  `buyer_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  `transaction_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `offer_id` (`offer_id`),
  KEY `farmer_id` (`farmer_id`),
  KEY `buyer_id` (`buyer_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`farmer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transactions_ibfk_3` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for: transactions
INSERT INTO `transactions` (`id`, `offer_id`, `farmer_id`, `buyer_id`, `amount`, `quantity`, `status`, `transaction_date`) VALUES (1, 1, 4, 5, '100.00', '5.00', 'completed', '2026-09-06 10:02:57');
INSERT INTO `transactions` (`id`, `offer_id`, `farmer_id`, `buyer_id`, `amount`, `quantity`, `status`, `transaction_date`) VALUES (2, 2, 4, 5, '1512.00', '56.00', 'completed', '2026-09-06 13:23:28');
INSERT INTO `transactions` (`id`, `offer_id`, `farmer_id`, `buyer_id`, `amount`, `quantity`, `status`, `transaction_date`) VALUES (3, 4, 8, 9, '460.00', '20.00', 'completed', '2026-09-07 13:25:50');
INSERT INTO `transactions` (`id`, `offer_id`, `farmer_id`, `buyer_id`, `amount`, `quantity`, `status`, `transaction_date`) VALUES (4, 5, 10, 9, '280.00', '10.00', 'completed', '2026-09-07 13:35:52');
INSERT INTO `transactions` (`id`, `offer_id`, `farmer_id`, `buyer_id`, `amount`, `quantity`, `status`, `transaction_date`) VALUES (5, 6, 12, 11, '690.00', '30.00', 'completed', '2026-09-17 07:18:51');
INSERT INTO `transactions` (`id`, `offer_id`, `farmer_id`, `buyer_id`, `amount`, `quantity`, `status`, `transaction_date`) VALUES (6, 7, 12, 5, '3000.00', '50.00', 'completed', '2026-09-17 09:49:04');
INSERT INTO `transactions` (`id`, `offer_id`, `farmer_id`, `buyer_id`, `amount`, `quantity`, `status`, `transaction_date`) VALUES (7, 8, 12, 5, '368.00', '8.00', 'completed', '2026-09-17 10:11:45');
INSERT INTO `transactions` (`id`, `offer_id`, `farmer_id`, `buyer_id`, `amount`, `quantity`, `status`, `transaction_date`) VALUES (8, 10, 12, 5, '150.00', '6.00', 'completed', '2026-09-18 19:56:00');
INSERT INTO `transactions` (`id`, `offer_id`, `farmer_id`, `buyer_id`, `amount`, `quantity`, `status`, `transaction_date`) VALUES (9, 11, 13, 5, '840.00', '30.00', 'completed', '2026-09-17 15:39:33');
INSERT INTO `transactions` (`id`, `offer_id`, `farmer_id`, `buyer_id`, `amount`, `quantity`, `status`, `transaction_date`) VALUES (10, 13, 12, 15, '100.00', '2.00', 'cancelled', '2026-09-18 19:55:15');
INSERT INTO `transactions` (`id`, `offer_id`, `farmer_id`, `buyer_id`, `amount`, `quantity`, `status`, `transaction_date`) VALUES (11, 12, 12, 15, '350.00', '14.00', 'completed', '2026-09-18 20:43:32');
INSERT INTO `transactions` (`id`, `offer_id`, `farmer_id`, `buyer_id`, `amount`, `quantity`, `status`, `transaction_date`) VALUES (12, 16, 16, 9, '350.00', '10.00', 'completed', '2026-09-19 11:40:30');
INSERT INTO `transactions` (`id`, `offer_id`, `farmer_id`, `buyer_id`, `amount`, `quantity`, `status`, `transaction_date`) VALUES (13, 15, 16, 9, '900.00', '15.00', 'completed', '2026-09-19 11:40:27');
INSERT INTO `transactions` (`id`, `offer_id`, `farmer_id`, `buyer_id`, `amount`, `quantity`, `status`, `transaction_date`) VALUES (14, 17, 17, 9, '420.00', '15.00', 'completed', '2026-09-20 14:40:21');
INSERT INTO `transactions` (`id`, `offer_id`, `farmer_id`, `buyer_id`, `amount`, `quantity`, `status`, `transaction_date`) VALUES (15, 18, 17, 9, '145.00', '5.00', 'pending', '2026-09-20 14:57:55');

-- -----------------------------------------------------
-- Table: users
-- -----------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('farmer','buyer','fpo','admin') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('active','suspended','under_review') DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for: users
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (1, 'System Admin', 'admin@agrilink.ai', '$2b$10$tTGwsvDQQIly4czUPwh7A.Nh2ZcE7RuhjIjpEDSCKTsE7A.VdYdy2', 'admin', '2026-09-05 10:02:07', 'active');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (2, 'Test Farmer', 'farmer@test.com', '$2b$10$C7Y2UDGa.Jlvl.wnwJp.IeQ/629O.hJ7aFbDqx.ln6REXHdm8Ocny', 'farmer', '2026-09-05 10:19:57', 'active');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (3, 'Another Test', 'another@test.com', '$2b$10$PA0lWnqkdOecc2zduVAY8OoGsfPfzUfp1tFVKViYEFnKVv1dDDuBO', 'farmer', '2026-09-05 10:29:15', 'active');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (4, 'SOUMAJIT CHAKRABORTY', 'soumajitchakraborty07@gmail.com', '$2b$10$kGQX0XK5hAKrtaCEH8GD8u.ReYbJwJ.MewuAVA2Jl22PCL1yxWFy6', 'farmer', '2026-09-05 14:04:36', 'active');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (5, 'S CHAKRABORTY', 'sc@mail.com', '$2b$10$8G1JaEtzwrLyZN5CkrP1Jeq1mp08PZRnaDrmbqnPoeClHGJhD8Sz.', 'buyer', '2026-09-05 16:04:45', 'active');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (6, 'SOUMAJIT CHAKRABORTY', 'sc1@mail.com', '$2b$10$yEFlzzRPS3GJiiuXvLDVvusFefjW09LrPnJOSv0i/7CoGgraW8Z4u', 'fpo', '2026-09-05 16:05:56', 'active');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (7, 'SOUMAJIT CHAKRABORTY', 'soumajitt27@gmail.com', '$2b$10$VVC/58IaweY1NZ/0/4yKpuOyDu8UttHft7KLu7XyCeVah3JVTp7H6', 'farmer', '2026-09-05 19:50:19', 'active');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (8, 'DEMO FARMAR', 'farmar@mail.com', '$2b$10$i5tTyy0a8n7uoBl/IA.f2uCGtcOpeL8PvHywwIsndmdUGOV0vMR6a', 'farmer', '2026-09-07 13:21:13', 'active');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (9, 'buyer', 'buyer@mail.com', '$2b$10$gxtIpKrEkJ1OXVh2LhlGOOELlvwleh1BuTyCYMGxsadF0V1hMhTve', 'buyer', '2026-09-07 13:23:40', 'active');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (10, 'farmar', 'farmar.demo@mail.com', '$2b$10$iU8IKvmlfshQ4tci00t3qObzBg47dkAZV85JjSddHMZXYQrHxD.LS', 'farmer', '2026-09-07 13:33:35', 'active');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (11, 'sc', 'sc2@mail.com', '$2b$10$4T5K8BrO50v9Lny9HnEsj.NH4JHiHNPDPK7Fm1IxPZhhLiN3qZ3d2', 'buyer', '2026-09-17 07:11:35', 'active');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (12, 'SAYAN MONDAL', 'sayan@mail.com', '$2b$10$nc075wt7XalExixlIgnU6OHkc0b1yYM6DPGwVBHZggs5izaO9NW5a', 'farmer', '2026-09-17 07:15:00', 'active');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (13, 'Lakshmi Patar', 'lakshmi@gmail.com', '$2b$10$wyJbWVIKSGO2XH1OUR0htON4Hd1BSrSoFXBt79rtgjurMrnLkqH0i', 'farmer', '2026-09-17 15:34:51', 'active');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (15, 'Dispute Buyer', 'disputeBuyer@mail.com', '$2b$10$xgcBEDlwcjsFWfAiRU.oQOzUjOCTTaRakvH.JWQm4N9qvGm6W9G0.', 'buyer', '2026-09-18 19:47:45', 'active');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (16, 'Farmar (RAHUL)', 'farmar@gmail.com', '$2b$10$93mxK7Ws5NCg5wrA0TZmYO8rm1ce1pPvx9dJL7MB/ym0/uoZ6/I1G', 'farmer', '2026-09-19 11:36:44', 'active');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`) VALUES (17, 'farmar1', 'farmar1@mail.com', '$2b$10$7tj1Ko0O2WFjUdbxI0unI.Motpfz/SrVULn90JxZuyx9S4BVQEOAK', 'farmer', '2026-09-20 14:35:52', 'active');

SET FOREIGN_KEY_CHECKS = 1;
