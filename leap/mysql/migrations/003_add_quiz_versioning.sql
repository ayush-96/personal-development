-- Migration: Add quiz versioning to preserve history when teachers edit quizzes
-- Date: 2025-01-XX
-- Description: Adds versioning system to track quiz versions and preserve student attempt history

-- Add quiz_version to files table to track current quiz version
ALTER TABLE files 
ADD COLUMN quiz_version INT DEFAULT 1,
ADD INDEX idx_quiz_version (quiz_version);

-- Add quiz_version to quiz_attempts to track which version student took
ALTER TABLE quiz_attempts
ADD COLUMN quiz_version INT DEFAULT 1,
ADD INDEX idx_quiz_version (quiz_version);

-- Add quiz_version to flashcards to track which version they belong to
ALTER TABLE flashcards
ADD COLUMN quiz_version INT DEFAULT 1,
ADD INDEX idx_quiz_version (quiz_version);

-- Add quiz_version to multiple_choice_question to track which version they belong to
ALTER TABLE multiple_choice_question
ADD COLUMN quiz_version INT DEFAULT 1,
ADD INDEX idx_quiz_version (quiz_version);

