# Student Dashboard Metrics

This document outlines comprehensive metrics that can be displayed on a student dashboard, covering quiz performance, learning activities, engagement, and progress tracking.

## Table of Contents
1. [Quiz-Related Metrics](#quiz-related-metrics)  
   - [Dashboard tab – quiz metrics (per space and per file)](#dashboard-tab--quiz-metrics-per-space-and-per-file)
2. [Activity-Related Metrics](#activity-related-metrics)
3. [Chat & Learning Metrics](#chat--learning-metrics)
4. [Engagement Metrics](#engagement-metrics)
5. [Progress & Achievement Metrics](#progress--achievement-metrics)
6. [Time-Based Metrics](#time-based-metrics)
7. [Topic & Content Metrics](#topic--content-metrics)

---

## Quiz-Related Metrics

**Context:** A **space** contains multiple **files**. Each file has a quiz section; teachers can publish a quiz per file, and students can take each quiz multiple times. Detailed score history lives on the **Quiz** tab; the **Dashboard** tab shows summary and trend metrics (below).

### Dashboard Tab – Quiz Metrics (per space and per file)

#### Overall Quiz Performance (for the space)
- **Total Quizzes Taken**: Total number of unique quizzes (files with a published quiz) attempted in the space (e.g., 8)
- **Total Quiz Attempts**: Total number of quiz attempts in the space, including retakes
- **Total Points Earned / Total Points Possible**: Cumulative score across all attempts in the space (e.g., 120/200), or same expressed as **Total Quiz Scores** (earned vs possible)
- **Average Quiz Score**: Overall average score (or percentage) across all quiz attempts in the space
- **Quiz Completion Rate (Space)**: Percentage of files with published quizzes in the space that the student has attempted at least once
- **Perfect Scores Count**: Number of files (quizzes) in the space where the student achieved 100% at least once

#### Per-File (Per-Topic) Metrics
- **Quiz Attempts per File**: Number of quiz attempts for each file (topic) in the space
- **Best Score per Quiz**: Highest score (or percentage) achieved for each file’s quiz
- **Average Score per Quiz**: Average score across all attempts for each file’s quiz
- **Score Improvement per File**: First attempt vs. latest (or best) attempt for each file — highlights improvement by topic
- **Quizzes Not Attempted (per space)**: Count or list of files in the space with a published quiz that the student has not attempted — supports “what to do next”
- **Last Attempt per File**: Most recent attempt date for each file’s quiz

#### Quiz Performance Trends
- **Score Trend Over Time**: Line chart showing score progression over time for the space (or per file)
- **Attempt Frequency**: How often quizzes are being retaken (e.g., weekly)
- **Weak Areas**: Files/topics with lowest quiz scores (or lowest average/best score)
- **Strong Areas**: Files/topics with highest quiz scores (or highest average/best score)
- **Improvement Rate**: Percentage improvement from first to best attempt (space-level or per file)
- **Consistency Score**: Standard deviation of scores in the space (lower = more consistent)

#### Additional Quiz Metrics (per space and per file)
- **Space Quiz Completion Rate**: Percentage of files with published quizzes in the space that have been attempted at least once (same as Quiz Completion Rate (Space), kept for clarity)
- **Last Quiz Activity in Space**: Most recent date/time the student took any quiz in the space — recency of engagement
- **Files with All Attempts Above Threshold**: Number of files where every attempt (or best attempt) meets a pass threshold (e.g., ≥ 70%) — mastery-style metric
- **Retry Count per Quiz**: Number of retakes per file (attempts − 1 for files with at least one attempt)

---

### Quiz Tab (score history)

Detailed attempt-by-attempt score history for each file’s quiz is shown on the **Quiz** tab; the metrics above are dashboard-level summaries and trends.

---

### Full Quiz Metrics Reference (all contexts)

#### Overall Quiz Performance (global)
- **Total Quizzes Taken**: Total number of unique quizzes (files) attempted
- **Total Quiz Attempts**: Total number of quiz attempts across all quizzes (including retakes)
- **Average Quiz Score**: Overall average score across all quiz attempts
- **Best Quiz Score**: Highest score achieved across all quizzes
- **Quiz Completion Rate**: Percentage of available quizzes that have been attempted at least once
- **Perfect Scores Count**: Number of quizzes where 100% was achieved

#### Per-Quiz / Per-File Metrics
- **Quiz Attempts per File**: Number of attempts for each quiz/file
- **Best Score per Quiz**: Highest score achieved for each quiz
- **Average Score per Quiz**: Average score across all attempts for each quiz
- **Score Improvement Trend**: Comparison of first attempt vs. latest attempt score
- **Retry Count per Quiz**: Number of retakes for each quiz
- **Time to Complete**: Average time taken to complete each quiz (if tracked)
- **First Attempt Date**: When the student first attempted each quiz
- **Last Attempt Date**: Most recent attempt date for each quiz

#### Quiz Performance Trends
- **Score Trend Over Time**: Line chart showing score progression over time
- **Attempt Frequency**: How often quizzes are being retaken
- **Improvement Rate**: Percentage improvement from first to best attempt
- **Consistency Score**: Standard deviation of scores (lower = more consistent)

#### Quiz Difficulty Analysis
- **Performance by Difficulty**: Average scores for Easy, Medium, Hard questions
- **Weak Areas**: Topics/subjects with lowest quiz scores
- **Strong Areas**: Topics/subjects with highest quiz scores
- **Question Accuracy Rate**: Percentage of questions answered correctly across all attempts

---

## Activity-Related Metrics

### File & Space Activity
- **Files Accessed**: Total number of unique files viewed/accessed
- **Spaces Active In**: Number of different spaces the student has interacted with
- **Common Spaces Used**: Number of teacher-created public spaces accessed
- **Personal Spaces Created**: Number of personal spaces created (if applicable)
- **Files Uploaded**: Total number of files uploaded (if students can upload)
- **Storage Used**: Total storage space used (in MB/GB)

### Learning Session Activity
- **Total Learning Sessions**: Number of distinct learning/study sessions
- **Active Days**: Number of days with at least one activity
- **Session Duration**: Average, total, and longest session duration
- **Peak Activity Times**: Most active hours/days of the week
- **Activity Streak**: Current and longest consecutive days of activity

### Interaction Frequency
- **Daily Activity Count**: Number of activities per day
- **Weekly Activity Summary**: Activities grouped by week
- **Monthly Activity Summary**: Activities grouped by month
- **Activity Heatmap**: Visual representation of activity across days/weeks

---

## Chat & Learning Metrics

### Chat Session Metrics
- **Total Chat Sessions**: Number of chat sessions created
- **Active Chat Sessions**: Number of sessions with recent activity
- **Chat Messages Sent**: Total number of user messages sent
- **Chat Messages Received**: Total number of assistant responses received
- **Average Messages per Session**: Average conversation length
- **Longest Conversation**: Session with most message exchanges

### Chat Type Breakdown
- **RagFlow Sessions**: Number of sessions using RagFlow assistant
- **OpenAI Sessions**: Number of sessions using OpenAI assistant
- **Study Mode Sessions**: Number of study-focused sessions
- **General Chat Sessions**: Number of general purpose sessions

### Chat Engagement
- **Average Session Duration**: Average time spent in chat sessions
- **Total Chat Time**: Cumulative time spent in all chat sessions
- **Most Active Chat Topics**: Topics most frequently discussed in chats
- **Chat Frequency**: How often chats are initiated
- **Response Time**: Average time between user message and assistant response

### Learning from Chat
- **Questions Asked**: Total number of questions asked in chats
- **Topics Explored**: Number of unique topics discussed
- **Study Sessions Completed**: Number of structured study sessions
- **Knowledge Gaps Identified**: Topics flagged as needing more study

---

## Engagement Metrics

### Platform Engagement
- **Login Frequency**: Number of logins per day/week/month
- **Days Since Last Login**: Recency of platform usage
- **Session Frequency**: How often the student uses the platform
- **Average Session Length**: Average time spent per session
- **Total Platform Time**: Cumulative time spent on the platform

### Feature Usage
- **Quiz Feature Usage**: Frequency of quiz feature usage
- **Chat Feature Usage**: Frequency of chat feature usage
- **Dashboard Views**: Number of times dashboard is accessed
- **File Access Frequency**: How often files are accessed
- **Space Navigation**: Number of space switches/navigations

### Engagement Trends
- **Engagement Trend**: Increasing, stable, or decreasing engagement over time
- **Peak Engagement Periods**: Times when student is most active
- **Engagement Score**: Composite score based on various activities
- **Activity Consistency**: Regularity of platform usage

---

## Progress & Achievement Metrics

### Learning Progress
- **Quizzes Completed**: Number of quizzes fully completed
- **Quizzes In Progress**: Number of quizzes started but not completed
- **Completion Percentage**: Percentage of available content completed
- **Progress by Space**: Progress tracking per learning space
- **Progress by Topic**: Progress tracking per subject/topic

### Achievement Badges/Milestones
- **Perfect Score Achievements**: Number of 100% quiz scores
- **Improvement Achievements**: Recognition for score improvements
- **Consistency Achievements**: Recognition for regular activity
- **Explorer Badge**: Recognition for accessing multiple spaces/files
- **Scholar Badge**: Recognition for high engagement levels

### Performance Rankings (if applicable)
- **Class Ranking**: Position relative to other students (if data available)
- **Score Percentile**: Student's score percentile in class
- **Improvement Ranking**: Ranking based on improvement rate

---

## Time-Based Metrics

### Time Spent Learning
- **Total Learning Time**: Cumulative time spent on all activities
- **Average Daily Learning Time**: Average time per day
- **Weekly Learning Time**: Total time per week
- **Monthly Learning Time**: Total time per month
- **Time Distribution**: Breakdown of time across different activities

### Time Efficiency
- **Time per Quiz**: Average time to complete a quiz
- **Time per Chat Session**: Average duration of chat sessions
- **Time per File Review**: Average time spent reviewing files
- **Learning Velocity**: Rate of progress over time

### Activity Timing
- **Most Active Day**: Day of week with most activity
- **Most Active Hour**: Hour of day with most activity
- **Activity Patterns**: Weekly/monthly activity patterns

---

## Topic & Content Metrics

### Topic Engagement
- **Topics Explored**: Number of unique topics studied
- **Most Studied Topics**: Topics with highest engagement
- **Least Studied Topics**: Topics with lowest engagement
- **Topic Coverage**: Percentage of available topics explored
- **Topic Depth**: Level of engagement per topic

### Content Interaction
- **Files per Topic**: Number of files accessed per topic
- **Quizzes per Topic**: Number of quizzes taken per topic
- **Chats per Topic**: Number of chat sessions per topic
- **Topic Mastery Score**: Composite score based on quiz performance and engagement

### Learning Path
- **Topics Sequence**: Order in which topics are being studied
- **Prerequisite Completion**: Progress on foundational topics
- **Advanced Topics Started**: Number of advanced topics attempted
- **Learning Path Efficiency**: Optimal vs. actual learning path

---

## Recommended Dashboard Layout

### Quick Stats Cards (Top Section)
1. **Total Quizzes Taken** - Quick count
2. **Average Quiz Score** - Percentage
3. **Total Learning Time** - Hours/minutes
4. **Active Days** - Number of days
5. **Current Streak** - Consecutive days

### Main Metrics Sections

#### Section 1: Quiz Performance
- Overall quiz statistics
- Score trend chart
- Per-quiz breakdown table
- Improvement metrics

#### Section 2: Learning Activity
- Activity timeline/calendar
- Session duration charts
- Feature usage breakdown
- Engagement heatmap

#### Section 3: Chat & Interaction
- Chat session statistics
- Message count trends
- Topic exploration map
- Study session summary

#### Section 4: Progress Tracking
- Completion progress bars
- Achievement badges
- Topic mastery visualization
- Learning path overview

#### Section 5: Insights & Recommendations
- Weak areas to focus on
- Suggested next topics
- Study recommendations
- Performance insights

---

## Implementation Notes

### Data Sources
- **quiz_attempts** table: Quiz scores, attempts, timestamps
- **chat_sessions** table: Session data, creation times
- **chat_messages** table: Message counts, timestamps, metadata
- **files** table: File access, uploads
- **spaces** table: Space membership, activity
- **users** table: Account creation, login tracking (if implemented)

### Calculated Metrics
Many metrics will require aggregation and calculation:
- Time-based aggregations (daily, weekly, monthly)
- Score calculations and percentages
- Trend analysis (improvement rates, consistency)
- Comparative metrics (first vs. latest attempt)

### Real-time vs. Cached
- **Real-time**: Current session data, recent activities
- **Cached**: Historical aggregations, trend calculations
- **Scheduled Updates**: Daily/weekly summary calculations

### Privacy Considerations
- All metrics are student-specific (filtered by user_id)
- No cross-student comparisons unless explicitly allowed
- Respect data privacy and retention policies

---

## Future Enhancements

### Advanced Analytics
- Predictive analytics for quiz performance
- Learning style identification
- Optimal study time recommendations
- Personalized learning path suggestions

### Gamification
- Points system based on activities
- Leaderboards (if privacy allows)
- Achievement unlocks
- Progress milestones

### Social Features (if applicable)
- Study group statistics
- Peer comparison (opt-in)
- Collaborative learning metrics

---

## Metric Priority for MVP

### High Priority (Must Have)
1. Total quizzes taken
2. Average quiz score
3. Best quiz score
4. Quiz attempts per file
5. Total chat sessions
6. Total learning time
7. Active days count
8. Score trend chart

### Medium Priority (Should Have)
1. Quiz completion rate
2. Score improvement trend
3. Chat messages count
4. Activity heatmap
5. Topic engagement
6. Weak areas identification
7. Learning streak

### Low Priority (Nice to Have)
1. Advanced analytics
2. Gamification elements
3. Social comparisons
4. Predictive insights

---

This comprehensive list provides a foundation for building a rich, informative student dashboard that helps students track their learning progress, identify areas for improvement, and stay engaged with the platform.




