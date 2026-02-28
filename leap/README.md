# LEAP

## ENV SETTING
1. npm create vite@latest client
2. express --no-view server

## SET RAGFLOW
'''
git clone https://github.com/infiniflow/ragflow.git
cd ragflow/
docker build --build-arg LIGHTEN=1 --build-arg NEED_MIRROR=1 -f Dockerfile -t infiniflow/ragflow:nightly-slim .
'''

## API LIST
use vite to build a front-end project called client. It has a component used to display a multiple-choice question. use javascript, react and tailwindcss to build this project.


# How to run
## check your docker is running
## terminal_1: cd client -> npm run dev
## terminam_2: cd server -> json-server db.json -p 3001
## terminam_3: cd server -> npm start
