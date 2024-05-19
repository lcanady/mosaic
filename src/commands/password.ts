import { createHash } from "crypto";
import { addCmd, dbobjs } from "../lib";
import { send } from "../lib/broadcast";

export default () => {
  addCmd({
    name: "password",
    pattern: /^[@\+]?password\s(.*)\s*=\s*(.*)/i,
    lock: "connected",
    description: "Change your password",
    handler: async (ctx, args) => {
      if (!ctx.socket.cid) return;
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const [oldPass, newPass] = args;

      if (oldPass === newPass) {
        return send({
          target: ctx.socket.cid,
          msg: "You can't use the same password.",
        });
      }

      const hash = createHash("sha512");
      const passHash = hash.update(oldPass).digest("hex");

      if (passHash !== en.data.password) {
        return send({ target: ctx.socket.cid, msg: "Sorry." });
      }

      const secondHash = createHash("sha512");
      const newHash = secondHash.update(newPass).digest("hex");
      en.data.password = newHash;
      await dbobjs.updateOne({ _id: en._id }, { $set: en });
      return send({ target: ctx.socket.cid, msg: "Password changed." });
    },
  });
};
