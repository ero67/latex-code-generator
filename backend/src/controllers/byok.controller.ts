import { Request, Response } from "express";
import { User } from "../models/User";
import { encryptSecret } from "../utils/encryption";

type AuthenticatedRequest = Request & { user?: any };

const getUserId = (req: AuthenticatedRequest): string | undefined => {
  const user = req.user;
  if (!user) return undefined;
  return String(user._id || user.id);
};

export const getByokStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Please authenticate",
      });
    }

    const user = await User.findById(userId).select(
      "+openRouterKeyCiphertext +openRouterKeyIv +openRouterKeyTag +openRouterKeyLast4 +openRouterKeyUpdatedAt"
    );

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const configured = Boolean(
      user.openRouterKeyCiphertext && user.openRouterKeyIv && user.openRouterKeyTag
    );

    return res.json({
      status: "success",
      data: {
        configured,
        last4: user.openRouterKeyLast4 || null,
        updatedAt: user.openRouterKeyUpdatedAt || null,
      },
    });
  } catch (error) {
    console.error("Error fetching BYOK status:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to load BYOK status",
    });
  }
};

export const setByokKey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Please authenticate",
      });
    }

    const apiKeyRaw = req.body?.apiKey;
    if (typeof apiKeyRaw !== "string" || !apiKeyRaw.trim()) {
      return res.status(400).json({
        status: "error",
        message: "apiKey is required",
      });
    }

    const apiKey = apiKeyRaw.trim();
    const encrypted = encryptSecret(apiKey);

    const last4 = apiKey.slice(-4);
    const updatedAt = new Date();

    await User.findByIdAndUpdate(userId, {
      openRouterKeyCiphertext: encrypted.ciphertext,
      openRouterKeyIv: encrypted.iv,
      openRouterKeyTag: encrypted.tag,
      openRouterKeyLast4: last4,
      openRouterKeyUpdatedAt: updatedAt,
    });

    return res.json({
      status: "success",
      data: {
        configured: true,
        last4,
        updatedAt,
      },
    });
  } catch (error) {
    console.error("Error saving BYOK key:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to save BYOK key",
    });
  }
};

export const deleteByokKey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Please authenticate",
      });
    }

    await User.findByIdAndUpdate(userId, {
      $unset: {
        openRouterKeyCiphertext: "",
        openRouterKeyIv: "",
        openRouterKeyTag: "",
        openRouterKeyLast4: "",
        openRouterKeyUpdatedAt: "",
      },
    });

    return res.json({
      status: "success",
      data: {
        configured: false,
        last4: null,
        updatedAt: null,
      },
    });
  } catch (error) {
    console.error("Error deleting BYOK key:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to delete BYOK key",
    });
  }
};
