-- Disable foreign key checks temporarily for table creation
SET FOREIGN_KEY_CHECKS = 0;

-- Set timezone to London
SET time_zone = 'Europe/London';

-- USERS table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('root', 'manager', 'teacher', 'student') NOT NULL DEFAULT 'student',
    avatar_url VARCHAR(500),
    isactivated BOOLEAN DEFAULT FALSE,
    isdeleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- SPACES table
CREATE TABLE IF NOT EXISTS spaces (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT NOT NULL,   
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    icon VARCHAR(64) NULL,
    status ENUM('private', 'public') NOT NULL DEFAULT 'private',
    ragflow_dataset_id VARCHAR(255) DEFAULT NULL,
    isdeleted BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_spaces_owner (owner_id, isdeleted)
);

-- FILES table
CREATE TABLE IF NOT EXISTS files (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uploader_id BIGINT NOT NULL,
    space_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT DEFAULT NULL,
    checksum_sha256 CHAR(64) DEFAULT NULL,
    status ENUM('queued','processing','ready','error') NOT NULL DEFAULT 'queued',
    ragflow_document_id VARCHAR(255) DEFAULT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    isdeleted BOOLEAN DEFAULT FALSE, 

    CONSTRAINT fk_files_uploader FOREIGN KEY (uploader_id) REFERENCES users(id),
    CONSTRAINT fk_files_spaces FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE RESTRICT,

    INDEX idx_uploader_id (uploader_id),
    INDEX idx_space_id (space_id),
    INDEX idx_status (status),
    INDEX idx_storage_key (storage_key)
);

-- SPACE_MEMBERS table
CREATE TABLE IF NOT EXISTS space_members (
    user_id BIGINT NOT NULL,
    space_id BIGINT UNSIGNED NOT NULL,
    role ENUM('owner', 'admin', 'editor', 'viewer') NOT NULL DEFAULT 'editor',
    isdeleted BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, space_id),

    CONSTRAINT fk_space_members_space
        FOREIGN KEY (space_id) 
        REFERENCES spaces(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_space_members_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE  
);

-- FLASHCARDS table
CREATE TABLE IF NOT EXISTS flashcards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_id BIGINT NOT NULL,
    topic VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    isdeleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (file_id) REFERENCES files(id),
    INDEX idx_file_id (file_id)
);

-- MULTIPLE_CHOICE_QUESTION table
CREATE TABLE IF NOT EXISTS multiple_choice_question (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    flashcard_id BIGINT NOT NULL,
    question_text TEXT NOT NULL,
    correct_option JSON NOT NULL,
    incorrect_options JSON NOT NULL,
    difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL DEFAULT 'Hard',
    answer_reference TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    isdeleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (flashcard_id) REFERENCES flashcards(id),
    INDEX idx_flashcard_id (flashcard_id)
);


-- CHAT_ASSISTANTS table
-- Links spaces to RAGFlow chat assistants (knowledge bases)
-- Multiple chat assistants can exist per space
CREATE TABLE IF NOT EXISTS chat_assistants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    space_id BIGINT UNSIGNED NOT NULL,
    assistant_type ENUM('RagFlow', 'OpenAI', 'Google') NOT NULL DEFAULT 'RagFlow',
    assistant_id VARCHAR(255) NULL,
    status ENUM('creating', 'ready', 'error') NOT NULL DEFAULT 'creating',
    isdeleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_chat_assistants_space
        FOREIGN KEY (space_id) REFERENCES spaces(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_space_assistant_type
        UNIQUE (space_id, assistant_type),

    INDEX idx_space_id (space_id),
    INDEX idx_assistant_type (assistant_type)
);

-- CHAT_SESSIONS table
-- Stores chat sessions linked to chat assistants
CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    space_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT NOT NULL,
    chat_assistant_id BIGINT UNSIGNED NOT NULL,
    ragflow_session_id VARCHAR(255) NULL UNIQUE,
    title VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,
    isdeleted BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_chat_sessions_space
        FOREIGN KEY (space_id) REFERENCES spaces(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_chat_sessions_assistant
        FOREIGN KEY (chat_assistant_id) REFERENCES chat_assistants(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_chat_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_space_id (space_id),
    INDEX idx_user_id (user_id),
    INDEX idx_chat_assistant_id (chat_assistant_id),
    INDEX idx_ragflow_session_id (ragflow_session_id),
    INDEX idx_title (title),
    INDEX idx_user_space (user_id, space_id)
);


CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    provider ENUM('RagFlow', 'OpenAI', 'Google') NOT NULL DEFAULT 'RagFlow',
    role ENUM('user', 'assistant', 'system', 'tool') NOT NULL,
    content LONGTEXT NULL,
    model VARCHAR(100) DEFAULT NULL,
    external_message_id VARCHAR(255) DEFAULT NULL,
    tool_name VARCHAR(100) DEFAULT NULL,
    tool_call_id VARCHAR(255) DEFAULT NULL,
    prompt_tokens INT UNSIGNED DEFAULT NULL,
    completion_tokens INT UNSIGNED DEFAULT NULL,
    total_tokens INT UNSIGNED DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_chat_messages_session
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
        ON DELETE CASCADE,

    INDEX idx_session_id (session_id),
    INDEX idx_provider (provider),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at),
    INDEX idx_external_message_id (external_message_id)
);


-- -- USER_SESSIONS table
-- CREATE TABLE user_sessions (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     token VARCHAR(255) NOT NULL,
--     user_id BIGINT NOT NULL,
--     login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     expires_at TIMESTAMP NOT NULL,
--     last_active_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     logout_time TIMESTAMP NULL,
--     FOREIGN KEY (user_id) REFERENCES users(id),
--     INDEX idx_token (token),
--     INDEX idx_user_id (user_id)
-- );

-- -- USER_REFRESH_SESSIONS table
-- CREATE TABLE user_refresh_sessions (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     refresh_token VARCHAR(255) NOT NULL UNIQUE,
--     user_id BIGINT NOT NULL,
--     parent_token_id BIGINT,
--     issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     expires_at TIMESTAMP NOT NULL,
--     is_revoked BOOLEAN DEFAULT FALSE,
--     FOREIGN KEY (user_id) REFERENCES users(id),
--     FOREIGN KEY (parent_token_id) REFERENCES user_sessions(id),
--     INDEX idx_refresh_token (refresh_token),
--     INDEX idx_user_id (user_id)
-- );


-- -- TEST_ATTEMPTS table
-- CREATE TABLE test_attempts (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     test_id BIGINT NOT NULL,
--     user_id BIGINT NOT NULL,
--     start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     end_time TIMESTAMP NULL,
--     score DECIMAL(5,2),
--     FOREIGN KEY (user_id) REFERENCES users(id),
--     INDEX idx_user_id (user_id),
--     INDEX idx_test_id (test_id)
-- );

-- -- TEST_ATTEMPTS_ANSWERS table
-- CREATE TABLE test_attempt_answers (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     attempt_id BIGINT NOT NULL,
--     question_id BIGINT NOT NULL,
--     user_answer TEXT NOT NULL,
--     is_correct TINYINT NOT NULL,
--     FOREIGN KEY (attempt_id) REFERENCES test_attempts(id),
--     INDEX idx_attempt_id (attempt_id)
-- ); 

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
