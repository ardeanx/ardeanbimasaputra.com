CREATE TABLE "language" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translation" (
	"locale" text NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "translation_locale_key_pk" PRIMARY KEY("locale","key")
);
--> statement-breakpoint
ALTER TABLE "translation" ADD CONSTRAINT "translation_locale_language_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."language"("code") ON DELETE cascade ON UPDATE no action;