-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_ANSWER', 'MULTIPLE_ANSWER', 'FILL_IN');

-- CreateEnum
CREATE TYPE "MasteryState" AS ENUM ('WRONG', 'SHAKY', 'MASTERED');

-- CreateEnum
CREATE TYPE "ScopeKind" AS ENUM ('CERT', 'EXAM', 'TOPIC', 'OBJECTIVE', 'MISSED', 'UNSEEN', 'BOOKMARKS');

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "certificationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "objective" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "correctLetters" TEXT[],
    "acceptedAnswers" TEXT[],
    "answerDisplay" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionProgress" (
    "questionId" TEXT NOT NULL,
    "state" "MasteryState" NOT NULL,
    "correctStreak" INTEGER NOT NULL DEFAULT 0,
    "timesSeen" INTEGER NOT NULL DEFAULT 0,
    "timesCorrect" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionProgress_pkey" PRIMARY KEY ("questionId")
);

-- CreateTable
CREATE TABLE "DrillRun" (
    "id" TEXT NOT NULL,
    "scopeKind" "ScopeKind" NOT NULL,
    "scopeValue" TEXT NOT NULL,
    "questionIds" TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "DrillRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "questionId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "response" TEXT,
    "selfGraded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "questionId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("questionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Certification_slug_key" ON "Certification"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_certificationId_code_key" ON "Exam"("certificationId", "code");

-- CreateIndex
CREATE INDEX "Question_objective_idx" ON "Question"("objective");

-- CreateIndex
CREATE UNIQUE INDEX "Question_examId_number_key" ON "Question"("examId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOption_questionId_letter_key" ON "QuestionOption"("questionId", "letter");

-- CreateIndex
CREATE INDEX "QuestionProgress_state_idx" ON "QuestionProgress"("state");

-- CreateIndex
CREATE INDEX "DrillRun_scopeKind_scopeValue_startedAt_idx" ON "DrillRun"("scopeKind", "scopeValue", "startedAt");

-- CreateIndex
CREATE INDEX "Attempt_questionId_createdAt_idx" ON "Attempt"("questionId", "createdAt");

-- CreateIndex
CREATE INDEX "Attempt_runId_idx" ON "Attempt"("runId");

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionProgress" ADD CONSTRAINT "QuestionProgress_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DrillRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
