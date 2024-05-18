import { dbobjs, emitter } from "../lib";
import { send } from "../lib/broadcast";
import { LogoutEvent } from "../types/Events";

emitter.on("logout", async ({ dbref }: LogoutEvent) => {
  const en = await dbobjs.findOne({ dbref });
  if (!en) return;
  en.tags = en.tags.replace(/connected/, "");
  await dbobjs.updateOne({ dbref }, { $set: en });
  send({ target: en.data.location, msg: `${en.data.name} has left the game.` });
});
