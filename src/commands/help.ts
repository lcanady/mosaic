// example help command

import { addCmd, cmds, dbobjs, tags } from "../lib";
import { send } from "../lib/broadcast";
import { config } from "../lib/config";
import { capString, center, ljust } from "../lib/formatting";
import { Command } from "../types/Command";

export default () => {
  addCmd({
    name: "help",
    lock: "connected",
    pattern: /^[@\+]?help\s?(.*)?$/,
    description: "Get help on a topic",
    hidden: true,
    handler: async (ctx, args) => {
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      // if no topic is provided, send the full help text
      if (!args[0]) {
        const helpFiles = cmds
          .filter(
            (cmd: Command) => !cmd.hidden && tags.check(en.tags, cmd.lock || "")
          )
          .map((cmd: Command) => ({
            name: cmd.name,
            category: cmd.catagory || "general",
            description: cmd.description,
            helpfile: cmd.helpfile || "",
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        const categories = Array.from(
          new Set(helpFiles.map((m) => m.category))
        );

        let output =
          center(` %cc${config.get("mudName")} Help%cn `, 78, "=") + "\n";
        output +=
          " Topics        Reference               | Topics        Reference" +
          "\n";
        let col = 0;
        categories.forEach((category) => {
          output += center(` %cc${capString(category)}%cn `, 78, "=") + "\n";

          helpFiles
            .filter((helpFile) => helpFile?.category === category)
            .forEach((helpFile) => {
              output +=
                " " +
                ljust(`%ch${helpFile.name.toUpperCase()}%cn`, 13, ".") +
                " " +
                ljust(helpFile?.description || "", 23, ".");

              output += col % 2 === 0 ? " |" : "\n";
              col++;
            });

          if (col % 2 !== 0) {
            output += "\n";
          }

          col = 0;
        });

        output += "-".repeat(78) + "\n";
        output +=
          " For help, type '+help topic' where topic is one of the topics in caps.\n";
        output += "=".repeat(78) + "\n";

        send({ target: ctx.socket.id, msg: output });
      } else {
        const helpFile = cmds.find(
          (cmd: Command) => cmd.name.toUpperCase() === args[0].toUpperCase()
        );
        if (
          !helpFile ||
          helpFile.hidden ||
          !tags.check(en.tags, helpFile.lock || "") ||
          !helpFile.helpfile
        ) {
          send({
            target: ctx.socket.id,
            msg: "I don't know anything about that topic.",
          });
          return;
        }

        let output =
          center(` %cc${config.get("mudName")} Help%cn `, 78, "=") + "\n";
        output += ` %ch${helpFile.name.toUpperCase()}%cn\n\n`;
        output += ` ${helpFile.helpfile}\n`;
        output += "-".repeat(78);
        send({ target: ctx.socket.id, msg: output });
      }
    },
  });
};
