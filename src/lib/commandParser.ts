import { Command } from "../types/Command";
import { CmdEvent, MoveEvent } from "../types/Events";
import { send } from "./broadcast";
import { csend } from "./chennelSend";
import { channels, dbobjs } from "./database";
import { emitter } from "./emitter";
import { force } from "./force";
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
    if (!en) {
      next();
      return;
    }

    const msgParts = ctx.msg?.split(" ");

    const chan = en.data.channels?.find((c) => c.alias === msgParts?.[0]);
    if (!chan) {
      next();
      return;
    }

    const channel = await channels.findOne({ name: chan.name });
    if (!channel) {
      next();
      return;
    }

    if (msgParts?.[1].toLowerCase() === "on" && !chan.joined) {
      ctx.socket.join(channel.name);
      chan.joined = true;
      await dbobjs.updateOne({ _id: en._id }, { $set: en });
      csend(en, channel, `:has joined the channel.`);
      return;
    } else if (msgParts && msgParts[1] === "off" && chan.joined) {
      chan.joined = false;
      await dbobjs.updateOne({ _id: en._id }, { $set: en });
      csend(en, channel, `:has left the channel.`);
      ctx.socket.leave(channel.name);
      return;
    } else {
      if (!chan.joined)
        return send({
          target: ctx.socket.cid,
          msg: "You are not on that channel!",
        });
      csend(en, channel, msgParts?.slice(1).join(" ") || "");
    }
  },
  async (ctx, next) => {
    const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
    if (!en) {
      next();
      return;
    }

    const exits = await dbobjs
      .find({
        $and: [
          { "data.location": en.data.location },
          { tags: { $regex: "exit" } },
        ],
      })
      .toArray();

    for (const exit of exits) {
      exit.name = exit.data.name?.replace(";", "|");
      const patternTest = new RegExp(`^(${exit.name}$)`, "i");
      const from = await dbobjs.findOne({ dbref: en.data.location });
      const to = await dbobjs.findOne({ dbref: exit.data.destination });
      const match = patternTest.test(ctx.msg || "");

      if (match) {
        if (!en) return;

        if (!to || !from) return;

        ctx.socket.join(to.dbref);
        ctx.socket.leave(from.dbref);

        ctx.socket.broadcast
          .to(from.dbref)
          .emit("message", { msg: `${en.data.name} has left the room.` });

        send({
          target: ctx.socket.cid,
          msg: `You move to %ch${to?.data?.name}%cn.`,
        });

        emitter.emit<MoveEvent>("move", {
          socket: ctx.socket,
          dbref: ctx.socket.cid,
          from: en.data.location,
          to: exit.data.destination,
        });

        ctx.socket.broadcast.to(to.dbref).emit("message", {
          msg: `${en.data.name} arrives from %cn${from?.data?.name}%cn.`,
        });

        en.data.location = exit.data.destination;
        await dbobjs.updateOne({ _id: en._id }, { $set: en });

        force(ctx.socket, "look");
        return;
      }
    }
    next();
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
