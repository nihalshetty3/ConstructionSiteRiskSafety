import jwt from "jsonwebtoken";

export const generateAccessToken = (payload) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not set");
  }
  return jwt.sign(payload, secret, { expiresIn: "15m" });
};

export const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not set");
  }
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};

export const verifyAccessToken = (token) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not set");
  }
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not set");
  }
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

