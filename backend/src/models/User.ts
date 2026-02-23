import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export interface IUser extends mongoose.Document {
  email: string;
  password?: string;
  name: string;
  isAdmin: boolean;
  ssoId?: string; // preferred_username from SSO
  ssoProvider?: string; // e.g., "kpi-testing" or "kpi-production"
  employeeType?: string; // S (student), D (doktorand), P (pedagog), N (administratívny)
  openRouterKeyCiphertext?: string;
  openRouterKeyIv?: string;
  openRouterKeyTag?: string;
  openRouterKeyLast4?: string;
  openRouterKeyUpdatedAt?: Date;
  comparePassword(password: string): Promise<boolean>;
  generateAuthToken(): string;
}

export interface IUserModel extends mongoose.Model<IUser> {
  findOrCreateFromSSO(ssoData: {
    email: string;
    name: string;
    ssoId: string;
    ssoProvider: string;
    employeeType?: string;
  }): Promise<IUser>;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function (this: IUser) {
        // Password is required only if user is not using SSO
        return !this.ssoId;
      },
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    ssoId: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
      trim: true,
    },
    ssoProvider: {
      type: String,
      trim: true,
    },
    employeeType: {
      type: String,
      enum: ["S", "D", "P", "N"], // Student, Doktorand, Pedagog, Administratívny
      trim: true,
    },
    openRouterKeyCiphertext: {
      type: String,
      select: false,
    },
    openRouterKeyIv: {
      type: String,
      select: false,
    },
    openRouterKeyTag: {
      type: String,
      select: false,
    },
    openRouterKeyLast4: {
      type: String,
      select: false,
    },
    openRouterKeyUpdatedAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  // Only hash password if it's modified and exists (SSO users don't have passwords)
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  // SSO users don't have passwords
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Static method to find or create user from SSO data
 */
userSchema.statics.findOrCreateFromSSO = async function (ssoData: {
  email: string;
  name: string;
  ssoId: string;
  ssoProvider: string;
  employeeType?: string;
}) {
  // Try to find by SSO ID first
  let user = await this.findOne({ ssoId: ssoData.ssoId });

  if (user) {
    // Update existing SSO user
    user.email = ssoData.email;
    user.name = ssoData.name;
    user.ssoProvider = ssoData.ssoProvider;
    if (ssoData.employeeType) {
      user.employeeType = ssoData.employeeType;
    }
    await user.save();
    return user;
  }

  // Try to find by email (user might have registered with email/password before)
  user = await this.findOne({ email: ssoData.email });

  if (user) {
    // User exists with email/password, add SSO info
    user.ssoId = ssoData.ssoId;
    user.ssoProvider = ssoData.ssoProvider;
    user.name = ssoData.name; // Update name from SSO
    if (ssoData.employeeType) {
      user.employeeType = ssoData.employeeType;
    }
    await user.save();
    return user;
  }

  // Create new user
  user = new this({
    email: ssoData.email,
    name: ssoData.name,
    ssoId: ssoData.ssoId,
    ssoProvider: ssoData.ssoProvider,
    employeeType: ssoData.employeeType,
    // password is not set for SSO users
  });

  await user.save();
  return user;
};

userSchema.methods.generateAuthToken = function (): string {
  return jwt.sign(
    { id: this._id, name: this.name, isAdmin: this.isAdmin },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "24h" }
  );
};

export const User = mongoose.model<IUser, IUserModel>("User", userSchema);
