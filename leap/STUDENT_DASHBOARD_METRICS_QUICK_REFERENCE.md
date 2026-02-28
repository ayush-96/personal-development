# Student Dashboard Metrics - Quick Reference

## Quick Metrics Summary

### Dashboard Tab – Quiz Metrics (per space and per file)
- **Overall (space):** Total Quizzes Taken, Total Quiz Attempts, Total Points Earned/Possible, Average Quiz Score, Quiz Completion Rate (Space), Perfect Scores Count
- **Per file:** Quiz Attempts per File, Best Score per Quiz, Average Score per Quiz, Score Improvement per File, Quizzes Not Attempted, Last Attempt per File
- **Trends:** Score Trend Over Time, Attempt Frequency, Weak Areas, Strong Areas, Improvement Rate, Consistency Score
- **Additional:** Last Quiz Activity in Space, Files with All Attempts Above Threshold, Retry Count per Quiz

### Quiz Metrics (8 core metrics – global)
1. Total Quizzes Taken
2. Total Quiz Attempts
3. Average Quiz Score
4. Best Quiz Score
5. Quiz Completion Rate
6. Score Improvement Trend
7. Retry Count
8. Perfect Scores Count

### Activity Metrics (6 core metrics)
1. Files Accessed
2. Spaces Active In
3. Total Learning Sessions
4. Active Days
5. Session Duration
6. Activity Streak

### Chat Metrics (6 core metrics)
1. Total Chat Sessions
2. Chat Messages Sent/Received
3. Average Messages per Session
4. Chat Type Breakdown (RagFlow/OpenAI/Study)
5. Average Session Duration
6. Most Active Chat Topics

### Engagement Metrics (5 core metrics)
1. Login Frequency
2. Total Platform Time
3. Average Session Length
4. Feature Usage
5. Engagement Trend

---

## SQL Query Examples

### Quiz Metrics Queries

#### 1. Total Quizzes Taken
```sql
SELECT COUNT(DISTINCT file_id) as total_quizzes_taken
FROM quiz_attempts
WHERE user_id = ? AND isdeleted = FALSE;
```

#### 2. Total Quiz Attempts
```sql
SELECT COUNT(*) as total_attempts
FROM quiz_attempts
WHERE user_id = ? AND isdeleted = FALSE;
```

#### 3. Average Quiz Score (Overall)
```sql
SELECT 
    AVG(score) as avg_score,
    AVG((score / total_questions) * 100) as avg_percentage
FROM quiz_attempts
WHERE user_id = ? AND isdeleted = FALSE;
```

#### 4. Best Quiz Score
```sql
SELECT 
    MAX(score) as best_score,
    MAX((score / total_questions) * 100) as best_percentage
FROM quiz_attempts
WHERE user_id = ? AND isdeleted = FALSE;
```

#### 5. Quiz Completion Rate
```sql
-- Get total available quizzes (published quizzes)
SELECT 
    COUNT(DISTINCT qa.file_id) as attempted_quizzes,
    (SELECT COUNT(DISTINCT f.id) 
     FROM files f 
     WHERE f.quiz_published = TRUE AND f.isdeleted = FALSE) as total_available_quizzes,
    (COUNT(DISTINCT qa.file_id) / 
     (SELECT COUNT(DISTINCT f.id) 
      FROM files f 
      WHERE f.quiz_published = TRUE AND f.isdeleted = FALSE)) * 100 as completion_rate
FROM quiz_attempts qa
WHERE qa.user_id = ? AND qa.isdeleted = FALSE;
```

#### 6. Score Improvement Trend (First vs Latest)
```sql
SELECT 
    file_id,
    (SELECT score FROM quiz_attempts 
     WHERE user_id = ? AND file_id = qa.file_id 
     ORDER BY attempt_number ASC LIMIT 1) as first_score,
    (SELECT score FROM quiz_attempts 
     WHERE user_id = ? AND file_id = qa.file_id 
     ORDER BY attempt_number DESC LIMIT 1) as latest_score,
    (SELECT total_questions FROM quiz_attempts 
     WHERE user_id = ? AND file_id = qa.file_id 
     LIMIT 1) as total_questions
FROM quiz_attempts qa
WHERE qa.user_id = ? AND qa.isdeleted = FALSE
GROUP BY file_id;
```

#### 7. Perfect Scores Count
```sql
SELECT COUNT(DISTINCT file_id) as perfect_scores_count
FROM quiz_attempts
WHERE user_id = ? 
  AND score = total_questions 
  AND isdeleted = FALSE;
```

#### 8. Quiz Attempts per File
```sql
SELECT 
    f.id as file_id,
    f.title as file_title,
    COUNT(qa.id) as attempt_count,
    MAX(qa.score) as best_score,
    MAX(qa.total_questions) as total_questions,
    AVG(qa.score) as avg_score,
    MIN(qa.completed_at) as first_attempt,
    MAX(qa.completed_at) as last_attempt
FROM files f
LEFT JOIN quiz_attempts qa ON qa.file_id = f.id AND qa.user_id = ? AND qa.isdeleted = FALSE
WHERE f.quiz_published = TRUE AND f.isdeleted = FALSE
GROUP BY f.id, f.title
ORDER BY last_attempt DESC;
```

---

### Activity Metrics Queries

#### 1. Files Accessed
```sql
SELECT COUNT(DISTINCT file_id) as files_accessed
FROM quiz_attempts
WHERE user_id = ? AND isdeleted = FALSE

UNION ALL

SELECT COUNT(DISTINCT cs.space_id) as spaces_with_files
FROM chat_sessions cs
JOIN spaces s ON s.id = cs.space_id
WHERE cs.user_id = ? AND cs.isdeleted = FALSE;
```

#### 2. Spaces Active In
```sql
SELECT COUNT(DISTINCT space_id) as spaces_active
FROM chat_sessions
WHERE user_id = ? AND isdeleted = FALSE;
```

#### 3. Total Learning Sessions
```sql
SELECT COUNT(*) as total_sessions
FROM chat_sessions
WHERE user_id = ? AND isdeleted = FALSE;
```

#### 4. Active Days
```sql
SELECT COUNT(DISTINCT DATE(created_at)) as active_days
FROM (
    SELECT created_at FROM chat_sessions WHERE user_id = ? AND isdeleted = FALSE
    UNION ALL
    SELECT completed_at FROM quiz_attempts WHERE user_id = ? AND isdeleted = FALSE AND completed_at IS NOT NULL
) as activities;
```

#### 5. Session Duration (if end_time is tracked)
```sql
-- Note: This requires tracking session end times
-- Currently, you may need to estimate based on last message time
SELECT 
    cs.id as session_id,
    cs.created_at as start_time,
    MAX(cm.created_at) as last_activity,
    TIMESTAMPDIFF(MINUTE, cs.created_at, MAX(cm.created_at)) as duration_minutes
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cm.session_id = cs.id
WHERE cs.user_id = ? AND cs.isdeleted = FALSE
GROUP BY cs.id, cs.created_at;
```

#### 6. Activity Streak
```sql
-- Calculate consecutive days of activity
WITH daily_activity AS (
    SELECT DISTINCT DATE(created_at) as activity_date
    FROM (
        SELECT created_at FROM chat_sessions WHERE user_id = ? AND isdeleted = FALSE
        UNION ALL
        SELECT completed_at FROM quiz_attempts WHERE user_id = ? AND isdeleted = FALSE AND completed_at IS NOT NULL
    ) as activities
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
)
SELECT 
    MAX(streak_length) as current_streak
FROM (
    SELECT 
        activity_date,
        @streak := IF(DATEDIFF(activity_date, @prev_date) = 1, @streak + 1, 1) as streak_length,
        @prev_date := activity_date
    FROM daily_activity
    ORDER BY activity_date DESC
) as streaks;
```

---

### Chat Metrics Queries

#### 1. Total Chat Sessions
```sql
SELECT COUNT(*) as total_sessions
FROM chat_sessions
WHERE user_id = ? AND isdeleted = FALSE;
```

#### 2. Chat Messages Count
```sql
SELECT 
    COUNT(*) as total_messages,
    SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as messages_sent,
    SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) as messages_received
FROM chat_messages cm
JOIN chat_sessions cs ON cs.id = cm.session_id
WHERE cs.user_id = ? AND cs.isdeleted = FALSE;
```

#### 3. Average Messages per Session
```sql
SELECT 
    AVG(message_count) as avg_messages_per_session
FROM (
    SELECT 
        cs.id,
        COUNT(cm.id) as message_count
    FROM chat_sessions cs
    LEFT JOIN chat_messages cm ON cm.session_id = cs.id
    WHERE cs.user_id = ? AND cs.isdeleted = FALSE
    GROUP BY cs.id
) as session_counts;
```

#### 4. Chat Type Breakdown
```sql
SELECT 
    ca.assistant_type,
    COUNT(DISTINCT cs.id) as session_count,
    COUNT(cm.id) as message_count
FROM chat_sessions cs
JOIN chat_assistants ca ON ca.id = cs.chat_assistant_id
LEFT JOIN chat_messages cm ON cm.session_id = cs.id
WHERE cs.user_id = ? AND cs.isdeleted = FALSE
GROUP BY ca.assistant_type;
```

#### 5. Study Mode Sessions
```sql
SELECT COUNT(DISTINCT cs.id) as study_sessions
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cm.session_id = cs.id
WHERE cs.user_id = ? 
  AND cs.isdeleted = FALSE
  AND (
    cs.title LIKE '%study%' 
    OR (cm.metadata IS NOT NULL AND JSON_EXTRACT(cm.metadata, '$.studyMode') = true)
  );
```

---

### Engagement Metrics Queries

#### 1. Login Frequency (if login tracking exists)
```sql
-- This requires a login tracking table
-- Example structure: user_logins (user_id, login_time)
SELECT 
    COUNT(*) as login_count,
    COUNT(DISTINCT DATE(login_time)) as unique_login_days
FROM user_logins
WHERE user_id = ? 
  AND login_time >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

#### 2. Total Platform Time (estimated)
```sql
-- Estimate based on session activity
SELECT 
    SUM(TIMESTAMPDIFF(MINUTE, cs.created_at, COALESCE(MAX(cm.created_at), cs.updated_at))) as total_minutes
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cm.session_id = cs.id
WHERE cs.user_id = ? AND cs.isdeleted = FALSE
GROUP BY cs.id;
```

#### 3. Activity Heatmap Data
```sql
SELECT 
    DATE(created_at) as activity_date,
    HOUR(created_at) as activity_hour,
    COUNT(*) as activity_count
FROM (
    SELECT created_at FROM chat_sessions WHERE user_id = ? AND isdeleted = FALSE
    UNION ALL
    SELECT completed_at FROM quiz_attempts WHERE user_id = ? AND isdeleted = FALSE AND completed_at IS NOT NULL
) as activities
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at), HOUR(created_at)
ORDER BY activity_date, activity_hour;
```

---

## API Endpoint Suggestions

### Suggested Endpoints for Student Dashboard

```
GET /api/dashboard/student/overview
- Returns: Quick stats (total quizzes, avg score, active days, etc.)

GET /api/dashboard/student/quiz-stats
- Returns: Detailed quiz performance metrics

GET /api/dashboard/student/activity-stats
- Returns: Activity metrics (sessions, files, spaces)

GET /api/dashboard/student/chat-stats
- Returns: Chat engagement metrics

GET /api/dashboard/student/progress
- Returns: Learning progress and completion rates

GET /api/dashboard/student/trends?period=week|month|year
- Returns: Time-based trend data

GET /api/dashboard/student/insights
- Returns: Recommendations and insights
```

---

## Performance Considerations

1. **Caching**: Cache aggregated metrics for better performance
2. **Indexing**: Ensure proper indexes on user_id, created_at, file_id
3. **Pagination**: For large datasets, implement pagination
4. **Batch Processing**: Calculate daily/weekly summaries in background jobs
5. **Materialized Views**: Consider materialized views for complex aggregations

---

## Implementation Priority

### Phase 1 (MVP)
- Total quizzes taken
- Average quiz score
- Best quiz score
- Total chat sessions
- Active days

### Phase 2
- Score trends
- Activity heatmap
- Chat metrics
- Progress tracking

### Phase 3
- Advanced analytics
- Insights and recommendations
- Gamification elements




