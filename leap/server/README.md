# 
project-root/
├── src/
│   ├── config/
│   │   └── database.js                # MySQL 
│   ├── controllers/
│   │   └── user.controller.js
│   ├── services/
│   │   └── user.service.js
│   ├── routes/
│   │   └── user.routes.js
│   ├── middlewares/
│   │   └── auth.middleware.js
│   ├── utils/
│   │   └── jwt.util.js
├── app.js
├── .env
└── package.json


## User Registration API

**Endpoint:**  
`POST /user/register`
**Headers:**
| Header        | Value             |
|---------------|-------------------|
| Content-Type  | application/json  |
**Request Body Example:**
```json
{
  "email": "zhang@example.com",
  "password": "123456",
}
```
**Success Response:**
```json
{
  "code": 0,
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "zhang@example.com",
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```


**Endpoint:**  
`POST /user/login`
**Headers:**  
| Header        | Value             |
|---------------|-------------------|
| Content-Type  | application/json  |
**Request Body Example:**  
```json
{
  "email": "zhang@example.com",
  "password": "123456"
}
```
**Success Response:**
```json
{
  "code": 0,
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "zhang@example.com",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```




