-- CreateIndex
CREATE INDEX "feeds_source_idx" ON "feeds"("source");

-- CreateIndex
CREATE INDEX "feeds_category_idx" ON "feeds"("category");

-- CreateIndex
CREATE INDEX "feeds_enabled_idx" ON "feeds"("enabled");

-- CreateIndex
CREATE INDEX "feeds_source_category_idx" ON "feeds"("source", "category");

-- CreateIndex
CREATE INDEX "jobs_source_idx" ON "jobs"("source");

-- CreateIndex
CREATE INDEX "jobs_feedId_idx" ON "jobs"("feedId");

-- CreateIndex
CREATE INDEX "jobs_publishedAt_source_idx" ON "jobs"("publishedAt", "source");

-- CreateIndex
CREATE INDEX "jobs_publishedAt_feedId_idx" ON "jobs"("publishedAt", "feedId");

-- CreateIndex
CREATE INDEX "jobs_processedAt_source_idx" ON "jobs"("processedAt", "source");

-- CreateIndex
CREATE INDEX "jobs_title_idx" ON "jobs"("title");

-- CreateIndex
CREATE INDEX "jobs_feedId_publishedAt_idx" ON "jobs"("feedId", "publishedAt");

-- CreateIndex
CREATE INDEX "jobs_source_publishedAt_idx" ON "jobs"("source", "publishedAt");

-- CreateIndex
CREATE INDEX "jobs_feedId_source_publishedAt_idx" ON "jobs"("feedId", "source", "publishedAt");
