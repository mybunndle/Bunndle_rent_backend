import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import  prisma  from '../../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN   }
  );
}

export async function registerUser_Service({ name, email, phone, password }) {
  console.log("Before findUnique");

  console.log(prisma);
console.log(prisma.user);
console.log(Object.keys(prisma));

const existingUser = await prisma.user.findUnique({
  where: { email },
});


console.log(existingUser);
  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }
  console.log('No existing user found, proceeding to create a new user.');
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, phone, password: hashedPassword },
  });

  const token = generateToken(user);

  return {
    token,
    message: 'User registered successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function loginUser_Service({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (user.isBlocked) {
    const error = new Error('Your account has been blocked');
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  return {
    token,
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getUserProfile_Service(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      isBlocked: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
}

export async function changePassword_Service(userId, oldPassword, newPassword) {
  const user = await prisma.user.findUnique({ 
    where: {
      id: userId,
    },
   });

    //Check if user exists
    if (!user) {
       throw {
        statusCode: 404,
        message: 'User not found',
      };
    }

    //Check if old password is correct
    const isPasswordCorrect =  await bcrypt.compare(
      oldPassword,
      user.password
    );
    if (!isPasswordCorrect) {
      throw {
        statusCode: 400,
        message: 'Old password is incorrect',
      };
    }
      //. hash the new password
       const hashedPassword = await bcrypt.hash(newPassword, 10);

      //Update the user's password
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          password: hashedPassword,
        },
      });
      

      // Return a success message
      return {
        message: 'Password changed successfully',
      };
       }
  