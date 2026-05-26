CREATE TABLE `custom_list_words` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listId` int NOT NULL,
	`wordId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `custom_list_words_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_word_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`language` enum('korean','chinese','japanese','english') NOT NULL DEFAULT 'korean',
	`color` varchar(7) DEFAULT '#10b981',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_word_lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `custom_list_words` ADD CONSTRAINT `custom_list_words_listId_custom_word_lists_id_fk` FOREIGN KEY (`listId`) REFERENCES `custom_word_lists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_list_words` ADD CONSTRAINT `custom_list_words_wordId_words_id_fk` FOREIGN KEY (`wordId`) REFERENCES `words`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_word_lists` ADD CONSTRAINT `custom_word_lists_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_list_words_list` ON `custom_list_words` (`listId`);--> statement-breakpoint
CREATE INDEX `idx_list_words_word` ON `custom_list_words` (`wordId`);--> statement-breakpoint
CREATE INDEX `idx_list_words_unique` ON `custom_list_words` (`listId`,`wordId`);--> statement-breakpoint
CREATE INDEX `idx_custom_lists_user` ON `custom_word_lists` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_custom_lists_language` ON `custom_word_lists` (`language`);