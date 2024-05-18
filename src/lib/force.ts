import { MuSocket } from "../types/MuSoket";
import { commandHandler } from "./commandParser";

export const force = (socket: MuSocket, cmd: string) => {
    const ctx = {
        socket,
        msg: cmd,
        data: {},
    };
    
    commandHandler(ctx);
}