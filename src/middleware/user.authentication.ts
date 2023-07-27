import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();
import jwt, { JwtPayload } from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  user?: { email: string };
}

const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies["accesstoken"];
  if (!accessToken) {
    return res.status(400).json("user not logged in");
  }
  try {
    const access = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    ) as JwtPayload;
    (req as AuthenticatedRequest).user = { email: access.email };
    if (access) {
      return next();
    }
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message, message: "token invalid" });
  }
};

export default isAuthenticated;
