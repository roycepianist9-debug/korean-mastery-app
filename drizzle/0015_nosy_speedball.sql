CREATE TABLE `basics_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subsection` varchar(100) NOT NULL,
	`subsectionTitle` varchar(255) NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`example` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `basics_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `english_synonyms` DROP COLUMN `meaning`;--> statement-breakpoint
ALTER TABLE `english_synonyms` DROP COLUMN `exampleSentence`;