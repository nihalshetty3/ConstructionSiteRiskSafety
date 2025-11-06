import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dayjs from "dayjs";

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "SAFETY_OFFICER", "SUPERVISOR", "VIEWER"],
      default: "VIEWER",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOTP: {
      code: String,
      expiresAt: Date,
    },
    refreshTokens: [refreshTokenSchema],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate OTP
userSchema.methods.generateOTP = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = dayjs().add(10, "minute").toDate();
  this.emailVerificationOTP = { code, expiresAt };
  return code;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function (inputCode) {
  if (!this.emailVerificationOTP) {
    return false;
  }
  const { code, expiresAt } = this.emailVerificationOTP;
  if (dayjs().isAfter(dayjs(expiresAt))) {
    return false; // OTP expired
  }
  return code === inputCode;
};

// Method to add refresh token
userSchema.methods.addRefreshToken = function (token, expiresAt, userAgent) {
  this.refreshTokens.push({
    token,
    expiresAt,
    userAgent,
  });
  // Keep only last 5 refresh tokens per user
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

// Method to remove refresh token
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.token !== token);
};

// Method to clean expired refresh tokens
userSchema.methods.cleanExpiredTokens = function () {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter(
    (rt) => rt.expiresAt > now
  );
};

export const User = mongoose.model("User", userSchema);

