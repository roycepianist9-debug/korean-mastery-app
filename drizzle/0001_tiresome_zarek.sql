CREATE TABLE `user_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`wordId` int NOT NULL,
	`status` enum('new','reviewing','learned') NOT NULL DEFAULT 'new',
	`timesReviewed` int NOT NULL DEFAULT 0,
	`timesCorrect` int NOT NULL DEFAULT 0,
	`lastReviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`xp` int NOT NULL DEFAULT 0,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastStudyDate` varchar(10),
	`totalWordsLearned` int NOT NULL DEFAULT 0,
	`totalReviews` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_stats_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `words` (
	`id` int AUTO_INCREMENT NOT NULL,
	`korean` varchar(255) NOT NULL,
	`romanization` varchar(255) NOT NULL DEFAULT '',
	`pos` varchar(64) NOT NULL DEFAULT '',
	`meaning` text NOT NULL,
	`koreanExample` text,
	`exampleEnglish` text,
	`topikLevel` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'advanced',
	`chineseTerm` varchar(255) NOT NULL DEFAULT '',
	`pinyin` varchar(255) NOT NULL DEFAULT '',
	`chineseExample` text,
	`examplePinyin` text,
	CONSTRAINT `words_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_progress_user` ON `user_progress` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_progress_word` ON `user_progress` (`wordId`);--> statement-breakpoint
CREATE INDEX `idx_progress_user_word` ON `user_progress` (`userId`,`wordId`);--> statement-breakpoint
CREATE INDEX `idx_progress_status` ON `user_progress` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_stats_user` ON `user_stats` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_words_korean` ON `words` (`korean`);--> statement-breakpoint
CREATE INDEX `idx_words_pos` ON `words` (`pos`);--> statement-breakpoint
CREATE INDEX `idx_words_topik` ON `words` (`topikLevel`);--> statement-breakpoint
CREATE INDEX `idx_words_romanization` ON `words` (`romanization`);