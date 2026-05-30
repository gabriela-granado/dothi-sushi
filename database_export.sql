-- DoThi Sushi Database Export
-- Generated on 2026-05-29

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `openId` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(320) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loginMethod` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_openId_unique` (`openId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu Items Table
CREATE TABLE IF NOT EXISTS `menuItems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Menu Items
INSERT INTO `menuItems` (`name`, `price`) VALUES
('Hot Roll', 25.00),
('Temaki Hot', 30.00),
('Temaki', 20.00),
('Sashimi', 35.00),
('Niguiri', 28.00),
('Hossomaki', 18.00);

-- Orders Table
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customerName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `paymentMethod` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Pendente','Preparando','Pronto','Entregue') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendente',
  `total_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Items Table
CREATE TABLE IF NOT EXISTS `orderItems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `menuItemId` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `orderItems_orderId_fkey` (`orderId`),
  KEY `orderItems_menuItemId_fkey` (`menuItemId`),
  CONSTRAINT `orderItems_menuItemId_fkey` FOREIGN KEY (`menuItemId`) REFERENCES `menuItems` (`id`),
  CONSTRAINT `orderItems_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
