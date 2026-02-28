-- Migration: Add quiz attempts table to track student quiz scores and retries
-- Date: 2025-01-XX
-- Description: Tracks student quiz attempts, scores, and retry history

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    file_id BIGINT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    attempt_number INT NOT NULL DEFAULT 1,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    isdeleted BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_file_id (file_id),
    INDEX idx_user_file (user_id, file_id),
    INDEX idx_completed_at (completed_at)
);

