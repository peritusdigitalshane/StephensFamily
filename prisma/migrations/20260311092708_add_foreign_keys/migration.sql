-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Bot',
    "createdBy" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Agent_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Agent" ("createdAt", "createdBy", "description", "icon", "id", "isSystem", "name", "systemPrompt", "updatedAt") SELECT "createdAt", "createdBy", "description", "icon", "id", "isSystem", "name", "systemPrompt", "updatedAt" FROM "Agent";
DROP TABLE "Agent";
ALTER TABLE "new_Agent" RENAME TO "Agent";
CREATE INDEX "Agent_isSystem_idx" ON "Agent"("isSystem");
CREATE INDEX "Agent_createdBy_idx" ON "Agent"("createdBy");
CREATE TABLE "new_BulletinPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL DEFAULT 'note',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BulletinPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BulletinPost" ("author", "authorId", "category", "content", "createdAt", "id", "pinned", "title", "updatedAt") SELECT "author", "authorId", "category", "content", "createdAt", "id", "pinned", "title", "updatedAt" FROM "BulletinPost";
DROP TABLE "BulletinPost";
ALTER TABLE "new_BulletinPost" RENAME TO "BulletinPost";
CREATE INDEX "BulletinPost_authorId_idx" ON "BulletinPost"("authorId");
CREATE INDEX "BulletinPost_pinned_idx" ON "BulletinPost"("pinned");
CREATE TABLE "new_CalendarEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL DEFAULT '',
    "endTime" TEXT NOT NULL DEFAULT '',
    "memberId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "recurring" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalendarEvent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CalendarEvent_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CalendarEvent" ("category", "createdAt", "createdBy", "date", "endTime", "id", "memberId", "notes", "recurring", "time", "title", "updatedAt") SELECT "category", "createdAt", "createdBy", "date", "endTime", "id", "memberId", "notes", "recurring", "time", "title", "updatedAt" FROM "CalendarEvent";
DROP TABLE "CalendarEvent";
ALTER TABLE "new_CalendarEvent" RENAME TO "CalendarEvent";
CREATE INDEX "CalendarEvent_date_idx" ON "CalendarEvent"("date");
CREATE INDEX "CalendarEvent_memberId_idx" ON "CalendarEvent"("memberId");
CREATE INDEX "CalendarEvent_createdBy_idx" ON "CalendarEvent"("createdBy");
CREATE TABLE "new_MealPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "meal" TEXT NOT NULL,
    "recipe" TEXT NOT NULL,
    "prepBy" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MealPlan_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MealPlan" ("createdAt", "createdBy", "date", "id", "meal", "notes", "prepBy", "recipe", "updatedAt") SELECT "createdAt", "createdBy", "date", "id", "meal", "notes", "prepBy", "recipe", "updatedAt" FROM "MealPlan";
DROP TABLE "MealPlan";
ALTER TABLE "new_MealPlan" RENAME TO "MealPlan";
CREATE INDEX "MealPlan_date_idx" ON "MealPlan"("date");
CREATE INDEX "MealPlan_createdBy_idx" ON "MealPlan"("createdBy");
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL DEFAULT '',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL DEFAULT 'chore',
    "recurring" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("assignedTo", "category", "completed", "createdAt", "createdBy", "dueDate", "id", "recurring", "title", "updatedAt") SELECT "assignedTo", "category", "completed", "createdAt", "createdBy", "dueDate", "id", "recurring", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_assignedTo_idx" ON "Task"("assignedTo");
CREATE INDEX "Task_createdBy_idx" ON "Task"("createdBy");
CREATE INDEX "Task_completed_idx" ON "Task"("completed");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
