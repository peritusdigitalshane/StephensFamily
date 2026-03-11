-- CreateIndex
CREATE INDEX "Agent_isSystem_idx" ON "Agent"("isSystem");

-- CreateIndex
CREATE INDEX "Agent_createdBy_idx" ON "Agent"("createdBy");

-- CreateIndex
CREATE INDEX "BulletinPost_authorId_idx" ON "BulletinPost"("authorId");

-- CreateIndex
CREATE INDEX "BulletinPost_pinned_idx" ON "BulletinPost"("pinned");

-- CreateIndex
CREATE INDEX "CalendarEvent_date_idx" ON "CalendarEvent"("date");

-- CreateIndex
CREATE INDEX "CalendarEvent_memberId_idx" ON "CalendarEvent"("memberId");

-- CreateIndex
CREATE INDEX "CalendarEvent_createdBy_idx" ON "CalendarEvent"("createdBy");

-- CreateIndex
CREATE INDEX "MealPlan_date_idx" ON "MealPlan"("date");

-- CreateIndex
CREATE INDEX "MealPlan_createdBy_idx" ON "MealPlan"("createdBy");

-- CreateIndex
CREATE INDEX "ShoppingItem_checked_idx" ON "ShoppingItem"("checked");

-- CreateIndex
CREATE INDEX "Task_assignedTo_idx" ON "Task"("assignedTo");

-- CreateIndex
CREATE INDEX "Task_createdBy_idx" ON "Task"("createdBy");

-- CreateIndex
CREATE INDEX "Task_completed_idx" ON "Task"("completed");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_approved_idx" ON "User"("approved");
