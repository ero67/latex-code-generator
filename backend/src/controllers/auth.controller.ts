import { Request, Response } from "express";
import { User } from "../models/User";
import { KarnaughMap, IKarnaughMap } from "../models/KarnaughMap";

// Define as type instead of interface
type AuthRequest = Request<
  {},
  {},
  {
    email: string;
    password: string;
    name?: string;
  }
>;

type SaveKMRequest = Request<
  {},
  {},
  {
    tableSize: string;
    cellValues: string[];
    implicants: number[][];
    edgeImplicants: number[][];
  }
>;

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Email already registered",
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
    });

    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    res.status(201).json({
      status: "success",
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Detailed registration error:", error);
    res.status(500).json({
      status: "error",
      message: "Error creating user",
    });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        status: "error",
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = user.generateAuthToken();

    res.json({
      status: "success",
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error logging in",
    });
  }
};

export const saveKM = async (req: SaveKMRequest, res: Response) => {
  try {
    const { tableSize, cellValues, implicants, edgeImplicants } = req.body;

    // Create new Karnaugh map
    const karnaughMap = new KarnaughMap({
      tableSize,
      cellValues,
      implicants,
      edgeImplicants,
    });

    await karnaughMap.save();

    res.status(201).json({
      status: "success",
      data: karnaughMap,
    });
  } catch (error) {
    console.error("Error saving Karnaugh map:", error);
    res.status(500).json({
      status: "error",
      message: "Error saving Karnaugh map",
    });
  }
};
