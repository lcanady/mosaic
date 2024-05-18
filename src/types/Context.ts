import { MuSocket } from "./MuSoket";

export interface Context {
  socket: MuSocket;
  msg?: string;
  html?: string;
  data: any;
}
