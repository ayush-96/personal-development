-- Migration: Add quiz publishing fields to files table
-- Date: 2025-01-XX
-- Description: Adds fields to track quiz publishing status for teacher-student quiz distribution

ALTER TABLE files 
ADD COLUMN quiz_published BOOLEAN DEFAULT FALSE,
ADD COLUMN quiz_published_by BIGINT DEFAULT NULL,
ADD COLUMN quiz_published_at TIMESTAMP NULL DEFAULT NULL,
ADD CONSTRAINT fk_files_quiz_published_by FOREIGN KEY (quiz_published_by) REFERENCES users(id) ON DELETE SET NULL,
ADD INDEX idx_quiz_published (quiz_published);

