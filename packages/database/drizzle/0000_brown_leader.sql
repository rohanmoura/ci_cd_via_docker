CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" varchar(280) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
