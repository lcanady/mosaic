import { addCmd, dbobjs } from "../lib";
import { send } from "../lib/broadcast";
import { canEdit } from "../lib/displayName";
import { target } from "../lib/target";

export default () => {
  addCmd({
    name: "name",
    lock: "connected",
    pattern: /[@\+]?name\s+(.*)\s*=\s*(.*)/i,
    handler: async (ctx, args) => {
      if (!ctx.socket.cid) return;
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const [tar, newName] = args;
      const nameTarget = await target(en, tar);

      const takenName = await dbobjs.findOne({
        $or: [
          { "data.name": new RegExp(newName, "i") },
          { "data.alias": new RegExp(newName, "i") },
        ],
      });

      if (takenName && nameTarget?.tags.includes("avatar")) {
        send({
          target: ctx.socket.id,
          msg: `That name is taken, please choose another.`,
        });
        return;
      }

      if (!nameTarget || !canEdit(en, nameTarget)) {
        send({ target: ctx.socket.id, msg: "I don't see that here." });
        return;
      }

      nameTarget.data.name = newName;
      await dbobjs.updateOne({ _id: nameTarget._id }, { $set: nameTarget });
      send({ target: ctx.socket.id, msg: `Done. Name changed.` });
    },
  });

  addCmd({
    name: "alias",
    lock: "connected",
    pattern: /[@\+]?alias\s+(.*)\s*=\s*(.*)/i,
    handler: async (ctx, args) => {
      if (!ctx.socket.cid) return;
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const [tar, newAlias] = args;
      const aliasTarget = await target(en, tar);

      if (!aliasTarget || !canEdit(en, aliasTarget)) {
        send({ target: ctx.socket.id, msg: "I don't see that here." });
        return;
      }

      const takenAlias = await dbobjs.findOne({
        $or: [
          { "data.name": new RegExp(`^${newAlias}$`, "i") },
          { "data.alias": new RegExp(`^${newAlias}$`, "i") },
        ],
      });

      if (takenAlias) {
        send({
          target: ctx.socket.id,
          msg: `That alias is taken, please choose another.`,
        });
        return;
      }

      aliasTarget.data.alias = newAlias;
      await dbobjs.updateOne({ _id: aliasTarget._id }, { $set: aliasTarget });
      send({
        target: ctx.socket.id,
        msg: `Done. Alias for %ch${aliasTarget.data.name}%cn changed.`,
      });
    },
  });
};
