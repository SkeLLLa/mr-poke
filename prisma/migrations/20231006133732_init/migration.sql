-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "timezoneOffset" INTEGER NOT NULL DEFAULT 0,
    "locale" TEXT NOT NULL DEFAULT 'en-US',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slack_user" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "slack_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gitlab_user" (
    "id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "gitlab_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_email" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "user_email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slack_user_user_id_key" ON "slack_user"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "gitlab_user_user_id_key" ON "gitlab_user"("user_id");

-- CreateIndex
CREATE INDEX "user_email_domain_idx" ON "user_email"("domain");

-- CreateIndex
CREATE INDEX "user_email_email_idx" ON "user_email"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_user_id_email_key" ON "user_email"("user_id", "email");

-- AddForeignKey
ALTER TABLE "slack_user" ADD CONSTRAINT "slack_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gitlab_user" ADD CONSTRAINT "gitlab_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_email" ADD CONSTRAINT "user_email_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
