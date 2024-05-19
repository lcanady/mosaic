import { addCmd, db, dbobjs } from "../lib";
import { send } from "../lib/broadcast";
import { canEdit } from "../lib/displayName";
import { target } from "../lib/target";

export default () => {
  addCmd({
    name: "@desc",
    lock: "connected",
    pattern: /[@\+]?desc\s+(.*)\s*=\s*(.*)/i,
    handler: async (ctx, args) => {
      if (!ctx.socket.cid) return;
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const [tar, newDesc] = args;
      const descTarget = await target(en, tar);

      if (!descTarget || !canEdit(en, descTarget)) {
        send({ target: ctx.socket.id, msg: "I don't see that here." });
        return;
      }

      descTarget.data.attributes ||= [];
      const index = descTarget.data.attributes.findIndex(
        (a) => a.name === "description"
      );
      if (index > -1) {
        descTarget.data.attributes[index] = {
          name: "description",
          value: newDesc,
          setBy:
            tar === ctx.socket.cid || !ctx.socket.cid ? tar : ctx.socket.cid,
        };
      } else {
        descTarget.data.attributes.push({
          name: "description",
          value: newDesc,
          setBy:
            tar === ctx.socket.cid || !ctx.socket.cid ? tar : ctx.socket.cid,
        });
      }

      await dbobjs.updateOne({ _id: descTarget._id }, { $set: descTarget });

      send({ target: ctx.socket.id, msg: `Done. Description changed.` });
    },
  });
};
