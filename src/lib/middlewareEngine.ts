import { pipeline } from "@digibear/middleware";
import { Context } from "../types/Context";

export const engine = pipeline<Context>();
