-- CreateTable
CREATE TABLE "AIConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "apiKey" TEXT NOT NULL DEFAULT '',
    "selectedModel" TEXT NOT NULL DEFAULT 'gpt-4o',
    "enabledModels" TEXT NOT NULL DEFAULT '[]',
    "availableModels" TEXT NOT NULL DEFAULT '[]',
    "maxTokens" INTEGER NOT NULL DEFAULT 4096,
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "updatedAt" DATETIME NOT NULL
);
