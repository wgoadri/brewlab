CREATE TABLE `beans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`roaster` text,
	`origin` text,
	`process` text,
	`variety` text,
	`roast_level` text,
	`roast_date` integer,
	`altitude_masl` integer,
	`price_cents` integer,
	`weight_g` integer,
	`url` text,
	`notes` text,
	`rating` real,
	`is_favorite` integer DEFAULT false NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `brewers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`method` text NOT NULL,
	`model` text,
	`notes` text,
	`archived_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `brews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bean_id` integer,
	`brewer_id` integer,
	`grinder_id` integer,
	`method` text NOT NULL,
	`brewed_at` integer DEFAULT (unixepoch()) NOT NULL,
	`dose_g` real,
	`water_g` real,
	`ratio` real,
	`grind_setting` real,
	`water_temp_c` real,
	`total_time_s` integer,
	`bloom_water_g` real,
	`bloom_time_s` integer,
	`params_json` text,
	`steps_json` text,
	`overall_rating` real,
	`tasting_json` text,
	`notes` text,
	`is_favorite` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`bean_id`) REFERENCES `beans`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`brewer_id`) REFERENCES `brewers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`grinder_id`) REFERENCES `grinders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `grinders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text,
	`min_setting` real,
	`max_setting` real,
	`step_size` real,
	`notes` text,
	`archived_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
