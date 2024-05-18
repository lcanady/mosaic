import { io } from "../app";
import { ReturnType } from "../types/returnType";
import { parser } from "./parser";

export const send = (ret: ReturnType) => {
  // proccess the return type and send it to the target.
  ret.msg = parser.substitute("telnet", ret.msg);

  // if the returnType is missing a target it's a broadcast.
  if (!ret.target) {
    io.emit("message", ret);
    return;
  }

  // if the returnType has a target, send it to that target.
  io.to(ret.target).emit("message", ret);
};
