import { Socket } from "socket.io";

export interface MuSocket extends Socket {
  cid?: string;
}
