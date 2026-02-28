import { http } from "./http";

/**
 * Status: Implemented
 * User login.
 *
 * Purpose:
 * - Authenticate a user using email and password.
 * - Obtain an auth token (usually JWT) from the backend.
 *
 * Endpoint:
 * - POST /api/v1/user/login
 *
 * Path params:
 * - none
 *
 * Query params:
 * - none
 *
 * Request body (JSON):
 * - email: string (required)
 * - password: string (required)
 *
 * Authentication:
 * - Not required for login.
 *
 * Expected success response (200):
 * {
 *   "code": "OK",
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "token": "jwt_token_here",
 *     "user": {
 *       "id": "u123",
 *       "email": "user@example.com",
 *       "role": "student"
 *     }
 *   }
 * }
 *
 * Expected error responses:
 * - 1001: Missing email or password
 * - 1002: Invalid password
 * - 1003: User not found
 * - 1004: User not activated
 * - 5000: Internal server error
 */
export const login = async (email, password) => {
    const body = {
        email: email,
        password: password,
    };
    const res = await http.post("/api/v1/user/login", body);
    return res;
};

/**
 * Status: Implemented
 * Register a new user.
 *
 * Purpose:
 * - Create a new user account with email and password.
 *
 * Endpoint:
 * - POST /api/v1/user/register
 *
 * Path params:
 * - none
 *
 * Query params:
 * - none
 *
 * Request body (JSON):
 * - email: string (required)
 * - password: string (required)
 *
 * Authentication:
 * - Not required.
 *
 * Expected success response (201 or 200):
 * {
 *   "code": "OK",
 *   "success": true,
 *   "message": "User registered successfully",
 *   "data": {
 *     "token": "jwt_token_here",
 *     "user": {
 *       "id": "1234567",
 *       "email": "new@example.com"
 *     }
 *   }
 * }
 *
 * Expected error responses:
 * - 1001: Missing email or password
 * - 1005: Email already exists
 * - 1006: Missing role
 * - 1007: Teacher role requires glasgow.ac.uk email
 * - 1008: Student role requires student.gla.ac.uk email
 * - 1009: Invalid email domain
 * - 5000: Internal server error
 */
export const register = async (email, password, role) => {
    const body = {
        email: email,
        password: password,
        role: role,
    };
    const res = await http.post("/api/v1/user/register", body);
    return res;
};

/**
 * Status: Implemented
 * Get current user information.
 *
 * Purpose:
 * - Retrieve user profile info using the stored auth token.
 *
 * Endpoint:
 * - GET /api/v1/user/me
 *
 * Path params:
 * - none
 *
 * Query params:
 * - none
 *
 * Request body:
 * - none
 *
 * Authentication:
 * - Requires valid Bearer token in Authorization header.
 *
 * Expected success response (200):
 * {
 *   "code": "OK",
 *   "success": true,
 *   "message": "User info retrieved successfully",
 *   "data": {
 *     "user": {
 *       "id": "u123",
 *       "email": "user@example.com",
 *       "role": "student"
 *     }
 *   }
 * }
 *
 * Expected error responses:
 * - 2001: Missing or invalid token
 * - 5000: Internal server error
 * - 1003: User not found
 */
export const getUserInfo = async () => {
    const res = await http.get("/api/v1/user/me");
    return res;
};

/**
 * Status: Implemented
 * Logout user.
 *
 * Purpose:
 * - Remove auth token from client storage.
 * - Backend does not provide logout API; logout is done client-side only.
 *
 * Endpoint:
 * - None (client-side only)
 *
 * Path params:
 * - none
 *
 * Query params:
 * - none
 *
 * Request body:
 * - none
 *
 * Authentication:
 * - Not required.
 *
 * Expected behavior:
 * - Remove token from localStorage.
 * - Frontend treats user as logged out.
 *
 * Expected success response:
 * - true
 */
export const logout = async () => {
    localStorage.removeItem("token");
    return true;
};