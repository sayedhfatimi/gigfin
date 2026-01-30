ALTER TABLE `income` ADD `hours_worked` real;--> statement-breakpoint
CREATE INDEX `income_user_date_idx` ON `income` (`user_id`,`date`);--> statement-breakpoint
CREATE INDEX `income_user_platform_idx` ON `income` (`user_id`,`platform`);