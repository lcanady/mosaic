import { Context } from "../types/Context";
import { dbobjs } from "./database";

export const joinChannels = async ({ socket }: Context) => {
  const en = await dbobjs.findOne({ dbref: socket.cid });
  if (!en) return;

  if (en.data.location) {
    socket.join(en.data.location);
  }
};
