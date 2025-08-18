const bcrypt = require('bcryptjs');
const { getDatabase } = require('./database');

async function registerUser({ username, email, password, fullName }) {
    try {
        const db = await getDatabase();
        
        // Check if user already exists
        const existingUser = await db.get(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existingUser) {
            return {
                success: false,
                message: 'Username or email already exists'
            };
        }
        
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Insert new user
        const result = await db.run(
            'INSERT INTO users (username, email, password, full_name, created_at) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, fullName, new Date().toISOString()]
        );
        
        return {
            success: true,
            message: 'User registered successfully',
            userId: result.lastID
        };
        
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            message: 'Registration failed. Please try again.'
        };
    }
}

async function loginUser({ username, password }) {
    try {
        const db = await getDatabase();
        
        // Find user by username
        const user = await db.get(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        
        if (!user) {
            return {
                success: false,
                message: 'Invalid username or password'
            };
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return {
                success: false,
                message: 'Invalid username or password'
            };
        }
        
        // Update last login
        await db.run(
            'UPDATE users SET last_login = ? WHERE id = ?',
            [new Date().toISOString(), user.id]
        );
        
        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = user;
        
        return {
            success: true,
            message: 'Login successful',
            user: userWithoutPassword
        };
        
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: 'Login failed. Please try again.'
        };
    }
}

module.exports = {
    registerUser,
    loginUser
};
