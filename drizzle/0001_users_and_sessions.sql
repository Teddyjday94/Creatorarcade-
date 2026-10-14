CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expiresAt` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `session_user` ON `sessions` (`userId`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`providerId` text NOT NULL,
	`name` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`avatarUrl` text DEFAULT '' NOT NULL,
	`createdAt` text NOT NULL,
	`lastSeenAt` text NOT NULL,
	CONSTRAINT "user_provider_kind" CHECK("users"."provider" IN ('google','discord','twitch'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_provider` ON `users` (`provider`,`providerId`);