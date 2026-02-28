-- Migration: Add announcements table
-- Date: 2025-01-XX
-- Description: Creates announcements table for teachers to publish announcements to students

CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by BIGINT NOT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    isdeleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_announcements_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_created_by (created_by),
    INDEX idx_is_published (is_published),
    INDEX idx_isdeleted (isdeleted),
    INDEX idx_created_at (created_at)
);

