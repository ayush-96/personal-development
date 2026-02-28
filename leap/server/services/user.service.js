const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const jwtUtil = require('../utils/jwt');
const { BusinessError } = require('../errors/businessError');
const defaultSpaceService = require('./defaultSpace.service');

const SALT_ROUNDS = 12;

// user registration
// userData: { email, password, role, isactivated = true }
// return { token, user: { id: result.insertId, email} }
async function registerUser(userData) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { email, password, role, isactivated = true } = userData;

    if (!email || !password) {
      throw new BusinessError('Missing email or password', 1001);
    }

    if (!role) {
      throw new BusinessError('Missing role. Please select Teacher or Student', 1006);
    }

    // Validate role matches email domain
    const emailLower = email.toLowerCase();
    const isTeacherEmail = emailLower.includes('glasgow.ac.uk');
    const isStudentEmail = emailLower.includes('student.gla.ac.uk');

    if (role === 'teacher' && !isTeacherEmail) {
      throw new BusinessError('Teacher role requires a glasgow.ac.uk email address', 1007);
    }

    if (role === 'student' && !isStudentEmail) {
      throw new BusinessError('Student role requires a student.gla.ac.uk email address', 1008);
    }

    if (!isTeacherEmail && !isStudentEmail) {
      throw new BusinessError('Email must be from glasgow.ac.uk (teacher) or student.gla.ac.uk (student)', 1009);
    }

    // check if email already exists
    const [existingUser] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    if (existingUser.length > 0) {
      throw new BusinessError('Email already exists', 1005);
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // insert user with role
    const [result] = await connection.execute(
      'INSERT INTO users (email, password, role, isactivated) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, role, isactivated]
    );

    const token = jwtUtil.generateToken({
      userId: result.insertId,
      email,
      role
    });

    await connection.commit();

    // Set up default space for students (async, don't wait for it)
    // Note: This runs after connection is released, so it will get its own connection
    if (role === 'student') {
      defaultSpaceService.setupDefaultSpaceForStudent(result.insertId, role)
        .catch(err => {
          console.error(`Failed to setup default space for new student ${result.insertId}:`, err);
          // Don't fail registration if default space setup fails
        });
    }

    return {
      user: {
        id: result.insertId,
        email,
        role
      },
      token
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}


// user login
// body: { email, password }
// return { user: { id: result.insertId, email, role }, token }
async function loginUser(loginData) {
  const { email, password } = loginData;

  const connection = await pool.getConnection();
  try {
    if (!email || !password) {
      throw new BusinessError('Missing email or password', 1001);
    }

    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ? AND isdeleted = FALSE',
      [email]
    );

    if (users.length === 0) {
      throw new BusinessError('User not found', 1003);
    }

    const user = users[0];

    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new BusinessError('Invalid password', 1002);
    }

    // Check if the account is activated
    if (!user.isactivated) {
      throw new BusinessError('User not activated', 1004);
    }

    // Generate JWT token
    const token = jwtUtil.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Set up default space for students if they don't have one (async, don't wait for it)
    if (user.role === 'student') {
      defaultSpaceService.setupDefaultSpaceForStudent(user.id, user.role)
        .catch(err => {
          console.error(`Failed to setup default space for student ${user.id}:`, err);
          // Don't fail login if default space setup fails
        });
    }

    // Return user data and token (excluding password)
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token
    };
  } finally {
    connection.release();
  }
}


// get user by id
// @param {number} userId - user id
// @returns {Object} user data (id, email, role)
async function getUserById(userId) {
  const connection = await pool.getConnection();
  try {
    const [users] = await connection.execute(
      'SELECT id, email, role FROM users WHERE id = ? AND isdeleted = FALSE',
      [userId]
    );

    if (users.length === 0) {
      throw new BusinessError('User not found', 1003);
    }

    const user = users[0];
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  } finally {
    connection.release();
  }
}


module.exports = {
  registerUser,
  loginUser,
  getUserById
};