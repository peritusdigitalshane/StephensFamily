INSERT OR IGNORE INTO User (id, email, name, password, role, approved, color, avatar, createdAt, updatedAt)
VALUES (
  'superadmin-shane',
  'shane@shanes.com.au',
  'Shane',
  '$2b$12$votKUgjkGXaX9Foek/h4Dex1ClYMb2m/HEADg6.PClPzLMf1lXgV2',
  'superadmin',
  1,
  '#2563eb',
  'S',
  datetime('now'),
  datetime('now')
);

INSERT OR IGNORE INTO AIConfig (id, apiKey, selectedModel, enabledModels, availableModels, maxTokens, temperature, updatedAt)
VALUES ('singleton', '', 'gpt-4o', '[]', '[]', 4096, 0.7, datetime('now'));
