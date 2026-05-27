ALTER TABLE `orders` ADD `total_price` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `totalPrice`;