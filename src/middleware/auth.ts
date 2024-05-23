import { Response, NextFunction } from "express";
import { JwtPayload, verify } from "jsonwebtoken";
import { MuRequest } from "../types/MuReqest";

export const auth = async (
  req: MuRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];

    if (token) {
      try {
        const dbref = verify(
          token,
          process.env.JWT_SECRET || "secret"
        ) as JwtPayload;

        req.cid = dbref.dbref;
      } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ message: "Unauthorized" });
      }
    }
  }
  next();
};
