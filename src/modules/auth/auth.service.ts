import bcrypt from "bcrypt";
import prisma from "../../config/db.js";
import AppError from "../../utils/AppError.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";

const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
  role?: "STUDENT" | "FACULTY" | "ADMIN";
}) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new AppError(409, "User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: payload.role ?? "STUDENT",
    },
  });

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const loginUser = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email, deletedAt: null },
  });

  if (!user) {
    throw new AppError(404, "No user found with this email");
  }

  if (!user.password) {
    throw new AppError(400, "This account uses Google login, not password login");
  }

  const isPasswordCorrect = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordCorrect) {
    throw new AppError(401, "Incorrect password");
  }

  const jwtPayload = { id: user.id, role: user.role };
  const accessToken = generateAccessToken(jwtPayload);
  const refreshToken = generateRefreshToken(jwtPayload);

  return { accessToken, refreshToken };
};

const refreshAccessToken = async (refreshToken: string) => {
  const { verifyToken } = await import("../../utils/jwt.js");
  let decoded;
  try {
    decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET as string);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id, deletedAt: null } });
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const newAccessToken = generateAccessToken({ id: user.id, role: user.role });
  return { accessToken: newAccessToken };
};

export const AuthServices = { registerUser, loginUser, refreshAccessToken };