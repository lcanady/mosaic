import { dbobjs, emitter } from "../lib";
import { send } from "../lib/broadcast";
import { MoveEvent } from "../types/Events";

emitter.on<MoveEvent>("move", async ({ socket, to, from }) => {});
