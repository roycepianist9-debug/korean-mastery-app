CREATE TABLE `english_synonyms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`word` varchar(255) NOT NULL,
	`partOfSpeech` varchar(50) NOT NULL,
	`synonyms` json NOT NULL,
	`level` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'intermediate',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `english_synonyms_id` PRIMARY KEY(`id`),
	CONSTRAINT `english_synonyms_word_unique` UNIQUE(`word`)
);
