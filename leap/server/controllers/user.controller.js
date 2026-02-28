const userService = require('../services/user.service');
const response = require('../utils/response');

// user registration
// body: { email, password, role }
// role must be "teacher" or "student"
// email domain validation: glasgow.ac.uk = teacher, student.gla.ac.uk = student
// return {
//     "code": 0,
//     "success": true,
//     "message": "Registration successful",
//     "data": {
//       "user": {
//         "id": 1,
//         "email": "testuser@example.com",
//         "role": "student"
//       },
//       "token": "eyJ..."
//     }
// }
async function register(req, res) {
    try {
        const userData = req.body;

        const result = await userService.registerUser(userData);

        res.status(201).json(response.success(result, 'User registered successfully')); 
    } catch (err) {
        res.status(400).json(response.error(err.message, err.code));
    }
}

// user login
// body: { email, password }
// return {
//     "code": 0,
//     "success": true,
//     "message": "Login successful",
//     "data": {
//       "user": {
//         "id": 1,
//         "email": "testuser@example.com",
//         "role": "student"
//       },
//       "token": "eyJ..."
//     }
// }
async function login(req, res) {
    try {
      const loginData = req.body;
  
      const result = await userService.loginUser(loginData);
  
      return res.status(200).json(response.success(result, 'Login successful'));
    } catch (err) {
      return res.status(401).json(response.error(err.message, err.code));
    }
  }

// get current user, requires auth middleware to set req.user.id
// body: none
// return {
//     "code": 0,
//     "success": true,
//     "message": "User fetched successfully",
//     "data": {
//       "user": {
//         "id": 1,
//         "email": "testuser@example.com",
//         "role": "student"
//       }
//     }
// }
async function getMe(req, res) {
    try {
        const userId = req.user.userId;
        const result = await userService.getUserById(userId);
        res.status(200).json(response.success(result, 'User fetched successfully'));
    } catch (err) {
        res.status(404).json(response.error(err.message));
    }
}

module.exports = {
    register,
    login,
    getMe
};