import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/erp_alfadigi',
  jwtSecret: process.env.JWT_SECRET || 'alfa_digi_erp_fallback_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
