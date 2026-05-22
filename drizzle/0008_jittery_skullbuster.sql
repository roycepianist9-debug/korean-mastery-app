ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `guestSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_guestSessionId_unique` UNIQUE(`guestSessionId`);