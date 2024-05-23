import { Request } from "express";

export interface MuRequest extends Request {
  cid?: string;
}
