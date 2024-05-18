import { dbobjs, emitter } from "../lib";
import { send } from "../lib/broadcast";
import { LoginEvent } from "../types/Events";

emitter.on("login", async ({ dbref }: LoginEvent) => {
  const en = await dbobjs.findOne({ dbref });
  if (!en) return;

  send({ target: en.data.location, msg: `${en.data.name} has connected.` });
});
