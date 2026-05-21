ALTER TABLE `user_progress` MODIFY COLUMN `language` enum('korean','chinese','japanese') NOT NULL DEFAULT 'korean';--> statement-breakpoint
ALTER TABLE `words` MODIFY COLUMN `language` enum('korean','chinese','japanese') NOT NULL DEFAULT 'korean';--> statement-breakpoint
ALTER TABLE `words` ADD `japanese` varchar(255);--> statement-breakpoint
ALTER TABLE `words` ADD `hiragana` varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `words` ADD `romaji` varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `words` ADD `jlptLevel` enum('n5','n4','n3','n2','n1');--> statement-breakpoint
ALTER TABLE `words` ADD `japaneseExample` text;--> statement-breakpoint
ALTER TABLE `words` ADD `exampleRomaji` text;--> statement-breakpoint
ALTER TABLE `words` ADD `exampleJapaneseFrench` text;--> statement-breakpoint
CREATE INDEX `idx_words_japanese` ON `words` (`japanese`);--> statement-breakpoint
CREATE INDEX `idx_words_jlpt` ON `words` (`jlptLevel`);