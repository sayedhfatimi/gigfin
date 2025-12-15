CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expense_type` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`paid_at` text NOT NULL,
	`vehicle_profile_id` text,
	`notes` text,
	`unit_rate_minor` integer,
	`unit_rate_unit` text,
	`details_json` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_profile_id`) REFERENCES `vehicle_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `expenses_user_paid_at_idx` ON `expenses` (`user_id`,`paid_at`);--> statement-breakpoint
CREATE INDEX `expenses_user_type_idx` ON `expenses` (`user_id`,`expense_type`);--> statement-breakpoint
CREATE INDEX `expenses_vehicle_paid_at_idx` ON `expenses` (`vehicle_profile_id`,`paid_at`);--> statement-breakpoint
CREATE TABLE `vehicle_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text NOT NULL,
	`vehicle_type` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vehicle_profiles_user_idx` ON `vehicle_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `vehicle_profiles_user_default_idx` ON `vehicle_profiles` (`user_id`,`is_default`);--> statement-breakpoint
ALTER TABLE `user` ADD `unit_system` text DEFAULT 'metric' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `volume_unit` text DEFAULT 'litre' NOT NULL;