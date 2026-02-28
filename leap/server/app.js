const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require("cors");

const filesRouter = require('./routes/files');
const chatRouter = require('./routes/chat');
const quizRouter = require('./routes/quiz');
const userRouter = require('./routes/user');
const spaceRouter = require('./routes/space');
const announcementRouter = require('./routes/announcement');

const app = express();

app.use(cors());    // allow all origins
app.use(express.json());
app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));    // allow `public` directory to be accessed via URL
app.use(express.static(path.join(__dirname, 'files')));    // allow `files` directory to be accessed via URL

app.use(['/chat', '/api/v1/chat'], chatRouter);
app.use(['/files', '/api/v1/files'],filesRouter);
app.use(['/quiz', '/api/v1/quiz'], quizRouter);
app.use(['/user', '/api/v1/user'], userRouter);
app.use(['/space', '/api/v1/space'], spaceRouter);
app.use(['/announcement', '/api/v1/announcement'], announcementRouter);

module.exports = app;
