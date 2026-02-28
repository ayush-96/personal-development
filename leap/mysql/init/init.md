# USERS
| Field       | Type           | Description                                                |
|-------------|----------------|------------------------------------------------------------|
| id (PK)     | BIGINT AUTO    | Primary key (auto-increment)                               |
| email       | VARCHAR(255)   | User email (unique)                                        |
| password    | VARCHAR(255)   | Hashed password (not in plain text)                        |
| role        | ENUM           | User role ('root', 'manager', 'teacher', 'student')        |
| avatar_url  | VARCHAR(500)   | URL to user's avatar image                                 |
| isactivated | BOOLEAN        | User account activation status (true: activated)           |
| isdeleted   | BOOLEAN        | Soft deletion flag (true: deleted)                         |
| created_at  | TIMESTAMP      | Timestamp when the user record was created                 |
| updated_at  | TIMESTAMP      | Timestamp when the user record was last updated            |

# CLASSES
| Field        | Type           | Description                                                       |
|--------------|----------------|-------------------------------------------------------------------|
| id (PK)      | BIGINT AUTO    | Primary key                                                       |
| name         | VARCHAR(255)   | Class name                                                        |
| code         | VARCHAR(10)    | Unique class invitation code                                      |
| description  | TEXT           | Optional description                                              |
| start_date   | TIMESTAMP      | Class start date                                                  |
| end_date     | TIMESTAMP      | Class end date                                                    |
| status       | ENUM           | Class status ('active', 'archived', 'draft')                      |
| created_by   | BIGINT         | User ID of creator (must be teacher or above)                     |
| created_at   | TIMESTAMP      | When the class was created                                        |
| updated_at   | TIMESTAMP      | When the class was last updated                                   |
| isdeleted    | BOOLEAN        | Soft deletion flag (true: deleted)                                |

# USER_CLASSES
| Field          | Type           | Description                                                            |
|----------------|----------------|------------------------------------------------------------------------|
| id (PK)        | BIGINT AUTO    | Primary key                                                            |
| user_id (FK)   | BIGINT         | Foreign key referencing users.id                                       |
| class_id (FK)  | BIGINT         | Foreign key referencing classes.id                                     |
| role_in_class  | TINYINT        | Role in this class (1: teacher, 2: student)                            |
| status         | ENUM           | User status in class ('active', 'suspended', 'left')                   |
| joined_at      | TIMESTAMP      | When the user joined the class                                         |
| UNIQUE         | (user_id, class_id) | Prevents the same user from joining the same class multiple times |


# USER_SESSIONS
| Field            | Type           | Description                                             |
|------------------|----------------|---------------------------------------------------------|
| id (PK)          | BIGINT AUTO    | Primary key (auto-increment)                            |
| token            | VARCHAR(255)   | Session token (NOT NULL)                                |
| user_id (FK)     | BIGINT         | Foreign key referencing users.id                        |
| login_time       | TIMESTAMP      | The timestamp when the login occurred                   |
| expires_at       | TIMESTAMP      | Session expiration timestamp (NOT NULL)                 |
| last_active_time | TIMESTAMP      | Last activity timestamp (DEFAULT CURRENT_TIMESTAMP)     |
| logout_time      | TIMESTAMP      | Logout timestamp (NULL allowed)                         |


# USER_REFRESH_SESSIONS
| Field            | Type           | Description                                             |
|------------------|----------------|---------------------------------------------------------|
| id (PK)          | BIGINT AUTO    | Primary key (auto-increment)                            |
| refresh_token    | VARCHAR(255)   | Refresh token (NOT NULL, unique)                        |
| user_id (FK)     | BIGINT         | Foreign key referencing users.id                        |
| parent_token_id  | BIGINT         | Foreign key referencing user_sessions.id                |
| issued_at        | TIMESTAMP      | Token issue timestamp (DEFAULT CURRENT_TIMESTAMP)       |
| expires_at       | TIMESTAMP      | Token expiration timestamp (NOT NULL)                   |
| is_revoked       | BOOLEAN        | Token revocation status (DEFAULT FALSE)                 |


# PDFS
| Field         | Type           | Description                                                          |
|---------------|----------------|----------------------------------------------------------------------|
| id (PK)       | BIGINT AUTO    | Primary key (auto-increment)                                         |
| user_id (FK)  | BIGINT         | Foreign key referencing users.id (uploader)                          |
| title         | VARCHAR(255)   | Title or name of the PDF                                             |
| file_path     | VARCHAR(500)   | File path or URL/OSS link to the stored PDF                          | 
| status        | ENUM           | File status ('processing', 'ready', 'error')                         |
| upload_at     | TIMESTAMP      | Timestamp when the file was uploaded                                 |
| description   | TEXT           | Optional description of the PDF                                      |
| isdeleted     | BOOLEAN        | Soft deletion flag (true: deleted)                                   |
| is_private    | BOOLEAN        | Visibility flag (true: private, false: shared to class)              |
| class_id (FK) | BIGINT (NULL)  | If not null, references classes.id (shared with this class)          | 


# AI_CONVERSATIONS
| Field              | Type           | Description                                                       |
|--------------------|----------------|-------------------------------------------------------------------|
| id (PK)            | BIGINT AUTO    | Primary key (auto-increment)                                      |
| pdf_id (FK)        | BIGINT         | Foreign key referencing pdfs.id                                   |
| user_id (FK)       | BIGINT         | Foreign key referencing users.id (who initiated the conversation) |
| conversation_name  | VARCHAR(255)   | Optional name/title for the conversation                          |
| conversation_type  | TINYINT        | Conversation Type (0: RAG, 1: Normal)                             |
| created_at         | TIMESTAMP      | Timestamp when the conversation started                           |
| isdeleted          | BOOLEAN        | Soft deletion flag (true: deleted)                                |


# AI_MESSAGES
| Field              | Type           | Description                                                 |
|--------------------|----------------|-------------------------------------------------------------|
| id (PK)            | BIGINT AUTO    | Primary key (auto-increment)                                |
| conversation_id (FK)| BIGINT        | Foreign key referencing ai_conversations.id                 |
| sender_type        | TINYINT        | Who sent the message (0: user, 1: AI)                       |
| message_text       | TEXT           | The content of the message                                  |
| created_at         | TIMESTAMP      | Timestamp when the message was created                      |


# FLASHCARDS
| Field            | Type           | Description                                   |
|------------------|----------------|-----------------------------------------------|
| id (PK)          | BIGINT AUTO    | Primary key (auto-increment)                  |
| pdf_id (FK)      | BIGINT         | References pdfs.id                            |
| keywords_title   | VARCHAR(255)   | Title or keywords for the flashcard           |
| content          | TEXT           | Main content or summary text for the flashcard|
| created_at       | TIMESTAMP      | Timestamp when the flashcard was created      |
| updated_at       | TIMESTAMP      | Timestamp when the flashcard was last updated |
| isdeleted        | BOOLEAN        | Soft deletion flag (true: deleted)            |


# MULTIPLE_CHOICE_QUESTION
| Field             | Type           | Description                                                                 |
|-------------------|----------------|-----------------------------------------------------------------------------|
| id (PK)           | BIGINT AUTO    | Primary key (auto-increment)                                                |
| flashcard_id (FK) | BIGINT         | References flashcards.id                                                    |
| question_text     | TEXT           | The text or prompt for the question                                         |
| correct_options   | JSON           | The correct answer(s) stored in JSON format                                 |
| incorrect_options | JSON           | The incorrect option(s) stored in JSON format                               |
| difficulty        | TINYINT        | The difficulty level of the question (e.g., 1 = easy, 5 = hard, etc.)       |
| created_at        | TIMESTAMP      | Timestamp when the question was created                                     |
| isdeleted         | BOOLEAN        | Soft deletion flag (true: deleted)                                          |


# TEST_ATTEMPTS
| Field        | Type           | Description                                                           |
|--------------|----------------|-----------------------------------------------------------------------|
| id (PK)      | BIGINT AUTO    | Primary key (auto-increment)                                          |
| test_id (FK) | BIGINT         | Foreign key referencing tests.id                                      |
| user_id (FK) | BIGINT         | Foreign key referencing users.id                                      |
| start_time   | TIMESTAMP      | When the user started the test                                        |
| end_time     | TIMESTAMP      | When the user finished the test (optional)                            |
| score        | DECIMAL(5,2)   | The user's score for the test (could be stored as INT or FLOAT too)   |

# TEST_ATTEMPTS_ANSWERS
| Field         | Type           | Description                                                              |
|---------------|----------------|--------------------------------------------------------------------------|
| id (PK)       | BIGINT AUTO    | Primary key (auto-increment)                                             |
| attempt_id (FK)| BIGINT        | Foreign key referencing test_attempts.id                                 |
| question_id   | BIGINT         | An identifier for the question (could reference exercises.id)            |
| user_answer   | TEXT           | The user's submitted answer                                              |
| is_correct    | TINYINT        | Whether the answer is correct (0: no, 1: yes) or stores partial (e.g. 2) |