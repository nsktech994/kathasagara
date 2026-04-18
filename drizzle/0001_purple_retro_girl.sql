CREATE TABLE `aiChatHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`storyId` int NOT NULL,
	`userMessage` text NOT NULL,
	`aiResponse` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiChatHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `readAlongRecordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`storyId` int NOT NULL,
	`audioUrl` varchar(500) NOT NULL,
	`transcription` text,
	`durationSeconds` int,
	`accuracyScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `readAlongRecordings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `readingHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`storyId` int NOT NULL,
	`lastChapterRead` int DEFAULT 0,
	`progressPercentage` int DEFAULT 0,
	`readingTimeSeconds` int DEFAULT 0,
	`lastReadAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `readingHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(50) NOT NULL,
	`authorId` int,
	`illustrationUrl` varchar(500),
	`description` text,
	`ageGroup` varchar(20),
	`readingTimeMinutes` int,
	`isAiGenerated` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storyChapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storyId` int NOT NULL,
	`chapterNumber` int NOT NULL,
	`title` varchar(255),
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storyChapters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userFavorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`storyId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userFavorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `ageGroup` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `readingInterests` json;