CREATE TABLE `demo_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`pet` text NOT NULL,
	`reason` text NOT NULL,
	`stage` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_action` text
);
--> statement-breakpoint
CREATE TABLE `demo_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `demo_status` (
	`id` integer PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`updated_at` integer NOT NULL
);
