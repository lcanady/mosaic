import { addCmd, dbobjs, getAttr } from "../lib";
import { send } from "../lib/broadcast";
import { displayName } from "../lib/displayName";
import { center, columnize, formatTime, ljust, rjust } from "../lib/formatting";
import { target } from "../lib/target";
import { DbObj } from "../types/DbObj";

export default () => {
  addCmd({
    name: "look",
    // the pattern should match look, l, loo, lo, etc at a potential target.
    pattern: /^(look|loo|l|lo)\s?(.*)?$/,
    lock: "connected",
    description: "Look at a target",
    handler: async (ctx, args) => {
      if (!ctx.socket.cid) return;
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const tar = await target(en, args[1] || "");
      if (!tar) {
        return send({ target: ctx.socket.cid, msg: "I don't see that here." });
      }

      const avatars = await dbobjs
        .find({
          $and: [{ tags: /connected/ }, { "data.location": tar.dbref }],
        })
        .toArray();

      const exits = (
        await dbobjs
          .find({
            $and: [{ tags: /exit/ }, { "data.location": tar.dbref }],
          })
          .toArray()
      ).map((exit: DbObj) => {
        const nameParts = exit.data.name?.split(";");
        return nameParts?.[1]
          ? `<%cc${nameParts[1].toUpperCase()}%cn> ${nameParts[0]}`
          : nameParts?.[0];
      });

      let output = "";
      output += center(` %ch${displayName(en, tar)}%cn `, 78, "=") + "\n";

      output +=
        getAttr(tar, "description", "You see Nothing Special.") + "\n" ||
        "You see nothing special.\n\n";
      if (avatars.length > 0) {
        output += center(" %chCharacters%cn ", 78, "-") + "\n";
        avatars.forEach((avatar) => {
          output += `${ljust(displayName(en, avatar), 25)}${rjust(
            formatTime(avatar.data.lastCmd || 0),
            4
          )}  ${
            getAttr(avatar, "short-desc") ||
            ljust("%ch%cxuse '&short-desc me=<desc>' to set this.%cn", 78 - 26)
          }\n`;
        });
      }

      if (exits.length > 0) {
        output += center(" %chExits%cn ", 78, "-") + "\n";
        output += columnize(exits as string[], 3);
      }

      output += "=".repeat(78);

      send({ target: ctx.socket.id, msg: output });
    },
  });
};
