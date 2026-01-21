CREATE TYPE "public"."approval_status" AS ENUM('pending', 'threshold_met', 'executed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."signature_type" AS ENUM('signed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."milestone_status" AS ENUM('pending', 'in-review', 'changes-requested', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."vote" AS ENUM('approve', 'reject', 'abstain');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'in-review', 'changes-requested', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" integer NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "authenticators" (
	"credential_id" varchar(255) NOT NULL,
	"user_id" integer NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"credential_public_key" text NOT NULL,
	"counter" integer NOT NULL,
	"credential_device_type" varchar(32) NOT NULL,
	"credential_backed_up" boolean NOT NULL,
	"transports" varchar(255),
	CONSTRAINT "authenticators_user_id_credential_id_pk" PRIMARY KEY("user_id","credential_id"),
	CONSTRAINT "authenticators_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "discussions" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer,
	"milestone_id" integer,
	"group_id" integer NOT NULL,
	"type" varchar(20) DEFAULT 'submission' NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"period" varchar(20) NOT NULL,
	"total_submissions" integer DEFAULT 0 NOT NULL,
	"approved_submissions" integer DEFAULT 0 NOT NULL,
	"total_funding" bigint DEFAULT 0 NOT NULL,
	"average_approval_time" integer,
	"member_activity" text,
	"public_rating" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"permissions" text,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"logo_url" varchar(255),
	"type" varchar(20) NOT NULL,
	"focus_areas" jsonb,
	"website_url" varchar(255),
	"github_org" varchar(100),
	"wallet_address" varchar(64),
	"is_active" boolean DEFAULT true NOT NULL,
	"settings" jsonb,
	"funding_amount" bigint,
	"min_grant_size" bigint,
	"max_grant_size" bigint,
	"min_milestone_size" bigint,
	"max_milestone_size" bigint,
	"requirements" text,
	"application_template" text,
	"milestone_structure" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"discussion_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"content" text NOT NULL,
	"message_type" varchar(30) DEFAULT 'comment' NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestone_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"milestone_id" integer NOT NULL,
	"group_id" integer NOT NULL,
	"multisig_call_hash" varchar(128) NOT NULL,
	"multisig_call_data" text NOT NULL,
	"timepoint" jsonb,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"initiator_id" integer NOT NULL,
	"initiator_address" varchar(64) NOT NULL,
	"approval_workflow" varchar(20) NOT NULL,
	"payout_amount" varchar(64),
	"beneficiary_address" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"executed_at" timestamp,
	"execution_tx_hash" varchar(128),
	"execution_block_number" integer,
	"child_bounty_id" integer,
	"parent_bounty_id" integer NOT NULL,
	"price_usd" varchar(32),
	"price_date" timestamp,
	"price_source" varchar(32),
	"token_symbol" varchar(10),
	"token_amount" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "multisig_signatures" (
	"id" serial PRIMARY KEY NOT NULL,
	"approval_id" integer NOT NULL,
	"review_id" integer,
	"user_id" integer,
	"signatory_address" varchar(64) NOT NULL,
	"signature_type" "signature_type" NOT NULL,
	"tx_hash" varchar(128) NOT NULL,
	"signed_at" timestamp DEFAULT now() NOT NULL,
	"is_initiator" boolean DEFAULT false NOT NULL,
	"is_final_approval" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"amount" bigint,
	"due_date" timestamp,
	"status" "milestone_status" DEFAULT 'pending' NOT NULL,
	"deliverables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"github_repo_url" varchar(255),
	"github_pr_url" varchar(255),
	"github_commit_hash" varchar(64),
	"code_analysis" text,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"rejection_count" integer DEFAULT 0,
	"last_rejected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"group_id" integer,
	"type" varchar(32) NOT NULL,
	"submission_id" integer,
	"discussion_id" integer,
	"milestone_id" integer,
	"read" boolean DEFAULT false NOT NULL,
	"content" text NOT NULL,
	"priority" varchar(16) DEFAULT 'normal' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer,
	"milestone_id" integer,
	"group_id" integer NOT NULL,
	"amount" bigint NOT NULL,
	"transaction_hash" varchar(128),
	"block_explorer_url" varchar(500),
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"triggered_by" integer,
	"approved_by" integer,
	"wallet_from" varchar(64),
	"wallet_to" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "platform_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"period" varchar(20) NOT NULL,
	"total_groups" integer DEFAULT 0 NOT NULL,
	"total_submissions" integer DEFAULT 0 NOT NULL,
	"total_funding" bigint DEFAULT 0 NOT NULL,
	"average_success_rate" integer DEFAULT 0,
	"popular_tags" text,
	"trending_groups" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"milestone_id" integer,
	"reviewer_id" integer NOT NULL,
	"discussion_id" integer,
	"vote" "vote",
	"feedback" text,
	"review_type" varchar(20) DEFAULT 'standard' NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"is_binding" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"submitter_group_id" integer NOT NULL,
	"reviewer_group_id" integer NOT NULL,
	"submitter_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"executive_summary" text,
	"post_grant_plan" text,
	"labels" text,
	"github_repo_url" varchar(255),
	"wallet_address" varchar(64),
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"total_amount" bigint,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"email" varchar(255),
	"email_verified" timestamp,
	"password_hash" text,
	"github_id" varchar(64),
	"avatar_url" text,
	"wallet_address" varchar(64),
	"primary_group_id" integer,
	"primary_role" varchar(20) DEFAULT 'team' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_analytics" ADD CONSTRAINT "group_analytics_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_discussion_id_discussions_id_fk" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_approvals" ADD CONSTRAINT "milestone_approvals_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_approvals" ADD CONSTRAINT "milestone_approvals_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_approvals" ADD CONSTRAINT "milestone_approvals_initiator_id_users_id_fk" FOREIGN KEY ("initiator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multisig_signatures" ADD CONSTRAINT "multisig_signatures_approval_id_milestone_approvals_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."milestone_approvals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multisig_signatures" ADD CONSTRAINT "multisig_signatures_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multisig_signatures" ADD CONSTRAINT "multisig_signatures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_discussion_id_discussions_id_fk" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_discussion_id_discussions_id_fk" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submitter_group_id_groups_id_fk" FOREIGN KEY ("submitter_group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewer_group_id_groups_id_fk" FOREIGN KEY ("reviewer_group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submitter_id_users_id_fk" FOREIGN KEY ("submitter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_primary_group_id_groups_id_fk" FOREIGN KEY ("primary_group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;