-- CreateTable
CREATE TABLE "public"."discord_configs" (
    "id" SERIAL NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "maxJobsPerMessage" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discord_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feeds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "params" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jobs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "description" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jobs_link_key" ON "public"."jobs"("link");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_hash_key" ON "public"."jobs"("hash");

-- CreateIndex
CREATE INDEX "jobs_hash_idx" ON "public"."jobs"("hash");

-- CreateIndex
CREATE INDEX "jobs_publishedAt_idx" ON "public"."jobs"("publishedAt");

-- CreateIndex
CREATE INDEX "jobs_processedAt_idx" ON "public"."jobs"("processedAt");

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "public"."feeds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
