-- AlterTable
ALTER TABLE "DrillRun" ADD COLUMN "certificationId" TEXT;

-- Backfill: a run belongs to the certification of its first question.
UPDATE "DrillRun" AS r
SET "certificationId" = e."certificationId"
FROM "Question" AS q
JOIN "Exam" AS e ON e."id" = q."examId"
WHERE q."id" = r."questionIds"[1];

-- DropIndex
DROP INDEX "DrillRun_scopeKind_scopeValue_startedAt_idx";

-- CreateIndex
CREATE INDEX "DrillRun_certificationId_scopeKind_scopeValue_startedAt_idx" ON "DrillRun"("certificationId", "scopeKind", "scopeValue", "startedAt");

-- CreateIndex
CREATE INDEX "DrillRun_certificationId_startedAt_idx" ON "DrillRun"("certificationId", "startedAt");

-- AddForeignKey
ALTER TABLE "DrillRun" ADD CONSTRAINT "DrillRun_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
