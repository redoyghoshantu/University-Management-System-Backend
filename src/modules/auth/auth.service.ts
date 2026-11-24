import bcrypt from "bcrypt";
import prisma from "../../config/db.js";
import AppError from "../../utils/AppError.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import { createAuditLog } from "../../utils/auditLog.js";

const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
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
      role: "STUDENT", // public registration is always STUDENT; admins promote users via /admin/users/:id/role
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

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
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


const getMe = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true },
  });
  if (!user) throw new AppError(404, "User not found");
  return user;
};

const updateMe = async (userId: string, payload: { name?: string }) => {
  if (payload.name !== undefined && payload.name.trim().length < 2) {
    throw new AppError(400, "Name must be at least 2 characters");
  }
  return prisma.user.update({
    where: { id: userId },
    data: { name: payload.name?.trim() },
    select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true },
  });
};

const getGoogleAuthUrl = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL;

  if (!clientId || !redirectUri) {
    throw new AppError(500, "Google login is not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const googleLogin = async (code: string) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new AppError(500, "Google login is not configured");
  }

  // Step 1: code দিয়ে Google থেকে access token আনো
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new AppError(401, "Google login failed. Please try again");
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // Step 2: Google থেকে user-এর profile আনো
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!profileRes.ok) {
    throw new AppError(401, "Could not read Google profile");
  }

  const profile = (await profileRes.json()) as {
    sub: string;
    email: string;
    email_verified: boolean;
    name?: string;
  };

  if (!profile.email || !profile.email_verified) {
    throw new AppError(401, "Your Google email is not verified");
  }

  // Step 3: user খোঁজো বা বানাও
  let user = await prisma.user.findFirst({
    where: { googleId: profile.sub, deletedAt: null },
  });

  if (!user) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingByEmail) {
      if (existingByEmail.deletedAt) {
        throw new AppError(403, "This account has been deactivated");
      }
      // আগে password দিয়ে register করা account-এ googleId জুড়ে দাও
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { googleId: profile.sub, isVerified: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: profile.name ?? profile.email.split("@")[0],
          email: profile.email,
          googleId: profile.sub,
          isVerified: true,
          role: "STUDENT",
        },
      });
    }
  }

  // Step 4: নিজের JWT বানাও
  const jwtPayload = { id: user.id, role: user.role };
  const accessToken = generateAccessToken(jwtPayload);
  const refreshToken = generateRefreshToken(jwtPayload);

  await createAuditLog(user.id, "GOOGLE_LOGIN", "User", user.id);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

export const AuthServices = {
  registerUser,
  loginUser,
  refreshAccessToken,
  getMe,
  updateMe,
  getGoogleAuthUrl,
  googleLogin,
};