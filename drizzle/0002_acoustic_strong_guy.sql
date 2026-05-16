ALTER TABLE `user_stats` DROP INDEX `user_stats_userId_unique`;--> statement-breakpoint
ALTER TABLE `words` MODIFY COLUMN `korean` varchar(255);--> statement-breakpoint
ALTER TABLE `words` MODIFY COLUMN `topikLevel` enum('beginner','intermediate','advanced') DEFAULT 'advanced';--> statement-breakpoint
ALTER TABLE `user_progress` ADD `language` enum('korean','chinese') DEFAULT 'korean' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_stats` ADD `language` enum('korean','chinese') DEFAULT 'korean' NOT NULL;--> statement-breakpoint
ALTER TABLE `words` ADD `language` enum('korean','chinese') DEFAULT 'korean' NOT NULL;--> statement-breakpoint
ALTER TABLE `words` ADD `chinese` varchar(255);--> statement-breakpoint
ALTER TABLE `words` ADD `hskLevel` enum('1','2','3','4','5','6','7','8','9');--> statement-breakpoint
CREATE INDEX `idx_progress_language` ON `user_progress` (`language`);--> statement-breakpoint
CREATE INDEX `idx_progress_user_lang` ON `user_progress` (`userId`,`language`);--> statement-breakpoint
CREATE INDEX `idx_stats_user_lang` ON `user_stats` (`userId`,`language`);--> statement-breakpoint
CREATE INDEX `idx_words_language` ON `words` (`language`);--> statement-breakpoint
CREATE INDEX `idx_words_chinese` ON `words` (`chinese`);--> statement-breakpoint
CREATE INDEX `idx_words_hsk` ON `words` (`hskLevel`);--> statement-breakpoint
ALTER TABLE `words` DROP COLUMN `chineseTerm`;