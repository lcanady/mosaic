import { MuSocket } from "../types/MuSoket";
import { engine } from "./middlewareEngine";

export const force = (socket: MuSocket, cmd: string) => {
  const ctx = {
    socket,
    msg: cmd,
    data: {},
  };

  engine.execute(ctx);
};
