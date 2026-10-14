CREATE TABLE `assignmentComments` (
	`id` text PRIMARY KEY NOT NULL,
	`assignmentId` text NOT NULL,
	`authorId` text NOT NULL,
	`text` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`assignmentId`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`workspaceId` text NOT NULL,
	`entryId` text NOT NULL,
	`editorId` text NOT NULL,
	`brief` text NOT NULL,
	`format` text NOT NULL,
	`dueAt` text NOT NULL,
	`state` text DEFAULT 'assigned' NOT NULL,
	`deliverableUrl` text DEFAULT '' NOT NULL,
	`publicationUrl` text DEFAULT '' NOT NULL,
	`archivedAt` text,
	`version` integer DEFAULT 0 NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`entryId`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "assignment_state" CHECK("assignments"."state" IN ('assigned','editing','in_review','approved'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_active_assignment` ON `assignments` (`entryId`) WHERE "assignments"."archivedAt" IS NULL;--> statement-breakpoint
CREATE TABLE `auditEvents` (
	`id` text PRIMARY KEY NOT NULL,
	`workspaceId` text NOT NULL,
	`actorId` text NOT NULL,
	`action` text NOT NULL,
	`targetId` text NOT NULL,
	`metadata` text DEFAULT '' NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`workspaceId` text NOT NULL,
	`creatorId` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`game` text NOT NULL,
	`description` text NOT NULL,
	`rules` text NOT NULL,
	`criteria` text NOT NULL,
	`deadline` text NOT NULL,
	`originalDeadline` text NOT NULL,
	`state` text DEFAULT 'draft' NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "challenge_state" CHECK("challenges"."state" IN ('draft','published','closed','results_published'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `challenges_slug_unique` ON `challenges` (`slug`);--> statement-breakpoint
CREATE INDEX `challenge_workspace` ON `challenges` (`workspaceId`);--> statement-breakpoint
CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`challengeId` text NOT NULL,
	`submitterId` text NOT NULL,
	`displayName` text NOT NULL,
	`description` text NOT NULL,
	`clipUrl` text NOT NULL,
	`consentAt` text NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL,
	`privateNote` text DEFAULT '' NOT NULL,
	`viewerExplanation` text DEFAULT '' NOT NULL,
	`brokenLink` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`challengeId`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "entry_state" CHECK("entries"."state" IN ('pending','accepted','rejected','shortlisted'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_entry` ON `entries` (`challengeId`,`submitterId`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`workspaceId` text NOT NULL,
	`role` text DEFAULT 'editor' NOT NULL,
	`tokenHash` text NOT NULL,
	`expiresAt` text NOT NULL,
	`redeemedAt` text,
	`redeemedBy` text,
	`revokedAt` text,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_tokenHash_unique` ON `invitations` (`tokenHash`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`workspaceId` text NOT NULL,
	`userId` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "member_role" CHECK("memberships"."role" IN ('owner','editor')),
	CONSTRAINT "member_status" CHECK("memberships"."status" IN ('active','revoked'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_unique` ON `memberships` (`workspaceId`,`userId`);--> statement-breakpoint
CREATE TABLE `mutationChecks` (
	`id` text PRIMARY KEY NOT NULL,
	`allowed` integer NOT NULL,
	CONSTRAINT "mutation_allowed" CHECK("mutationChecks"."allowed"=1)
);
--> statement-breakpoint
CREATE TABLE `results` (
	`id` text PRIMARY KEY NOT NULL,
	`challengeId` text NOT NULL,
	`entryId` text NOT NULL,
	`rank` integer NOT NULL,
	FOREIGN KEY (`challengeId`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`entryId`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "positive_rank" CHECK("results"."rank">0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `result_rank` ON `results` (`challengeId`,`rank`);--> statement-breakpoint
CREATE UNIQUE INDEX `result_entry` ON `results` (`challengeId`,`entryId`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`ownerId` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`brandColor` text NOT NULL,
	`timezone` text NOT NULL,
	`isDemo` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_slug_unique` ON `workspaces` (`slug`);