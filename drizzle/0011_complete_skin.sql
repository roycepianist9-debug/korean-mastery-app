CREATE TABLE `saved_words` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`wordId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_words_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `saved_words` ADD CONSTRAINT `saved_words_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_words` ADD CONSTRAINT `saved_words_wordId_words_id_fk` FOREIGN KEY (`wordId`) REFERENCES `words`(`id`) ON DELETE cascade ON UPDATE no action;