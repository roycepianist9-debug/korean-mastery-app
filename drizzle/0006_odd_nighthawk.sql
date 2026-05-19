ALTER TABLE `words` ADD `meaningFr` text;--> statement-breakpoint
ALTER TABLE `words` ADD `exampleFrench` text;--> statement-breakpoint
ALTER TABLE `words` ADD `exampleChineseFrench` text;--> statement-breakpoint
CREATE INDEX `idx_words_meaning_fr` ON `words` (`meaningFr`);