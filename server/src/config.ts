import dotenv from 'dotenv';
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production.');
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/erp_alfadigi',
  jwtSecret: jwtSecret || 'alfa_digi_erp_dev_only_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
