import { Command } from "../types/Command";
import { CmdEvent } from "../types/Events";
import { send } from "./broadcast";
import { dbobjs } from "./database";
import { emitter } from "./emitter";
import { engine } from "./middlewareEngine";
import { tags } from "./tags";

export const cmds: Command[] = [];

export const addCmd = (cmd: Command) => {
  if (typeof cmd.pattern === "string") {
    const pattern = cmd.pattern.replace(/\*/g, "(.*)").replace(/\?/g, "(.)");
    cmd.pattern = new RegExp(`^${pattern}`);
  }

  cmds.push(cmd);
};

engine.use(
  async (ctx, next) => {
    const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
    if (en) {
    }
  },
  async (ctx, next) => {
    let avatar;
    if (ctx.socket.cid) {
      avatar = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (avatar) {
        avatar.data.lastCmd = Math.floor(Date.now() / 1000);
        dbobjs.updateOne({ _id: avatar._id }, { $set: avatar });
      }
    }

    for (const cmd of cmds) {
      const match = ctx.msg?.match(cmd.pattern);
      if (match && tags.check(avatar?.tags || "", cmd.lock || "")) {
        cmd.handler(ctx, match.slice(1));

        emitter.emit<CmdEvent>("cmd", {
          socket: ctx.socket,
          cmd: cmd.name,
          args: match.slice(1),
          dbref: ctx.socket.cid || "",
        });

        return;
      }
    }
    next();
  },
  async (ctx) => {
    if (ctx.socket.cid) {
      send({ target: ctx.socket.cid, msg: "Huh? type 'help' for help." });
    }
  }
);
