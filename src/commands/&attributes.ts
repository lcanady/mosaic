import { send } from "../lib/broadcast";
import { addCmd } from "../lib/commandParser";
import { dbobjs } from "../lib/database";
import { canEdit } from "../lib/displayName";
import { target } from "../lib/target";

export default () => {
  addCmd({
    name: "ATTRIBUTES",
    lock: "connected",
    hidden: true,
    pattern: /&(\S+)\s+(\S+)\s*=\s*(.*)/i,
    handler: async (ctx, args) => {
      if (!ctx.socket.cid) return;
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const [attr, tar, val] = args;
      const attrTarget = await target(en, tar);

      if (!attrTarget || !canEdit(en, attrTarget)) {
        send({ target: ctx.socket.id, msg: "I don't see that here." });
        return;
      }

      // see if it's already an attribute. If not, create it.  If there's no
      // value, remove it.
      attrTarget.data.attributes ||= [];
      const attrIndex = attrTarget.data.attributes.findIndex(
        (a) => a.name === attr
      );
      if (val === "") {
        if (attrIndex > -1) {
          attrTarget.data.attributes.splice(attrIndex, 1);
          await dbobjs.updateOne({ _id: attrTarget._id }, { $set: attrTarget });
        }
        send({
          target: ctx.socket.id,
          msg: `Done. Attribute %ch${attr.toUpperCase()}%cn removed.`,
        });
        return;
      }

      if (attrIndex > -1) {
        attrTarget.data.attributes[attrIndex].value = val;
      } else {
        attrTarget.data.attributes.push({ name: attr, value: val });
      }

      await dbobjs.updateOne({ _id: attrTarget._id }, { $set: attrTarget });
      send({
        target: ctx.socket.id,
        msg: `Done. Attribute %ch${attr.toUpperCase()}%cn set.`,
      });
    },
  });
};
