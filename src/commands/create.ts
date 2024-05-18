import { createHash } from "crypto";
import { addCmd } from "../lib/commandParser";
import { dbobjs } from "../lib/database";
import { DbObj } from "../types/DbObj";
import { setTags } from "../lib/setTags";
import { sign } from "jsonwebtoken";
import { config } from "dotenv";
import { emitter } from "../lib/emitter";
import { LoginEvent, LogoutEvent } from "../types/Events";
import { joinChannels } from "../lib/joinChannels";
import { Context } from "../types/Context";
import { send } from "../lib/broadcast";
import { force } from "../lib/force";
import { newDbref } from "../lib/newDbref";

config();

export default () => {
  addCmd({
    name: "create",
    lock: "!connected",
    hidden: true,
    pattern: /create\s+(.*)\s+(.*)/,
    handler: async (ctx, args) => {
      let [name, password] = args;

      const found = await dbobjs.findOne({
        $or: [
          { "data.name": new RegExp(name, "i") },
          {
            "data.alias": new RegExp(name, "i"),
          },
        ],
      });

      if (found) {
        ctx.socket.send({
          msg: `That name is taken, please choose another.`,
        });
        return;
      }
      const count = await newDbref();
      const countPlayers = await dbobjs.countDocuments({ tags: /avatar/ });

      const hash = createHash("sha512");
      password = hash.update(password).digest("hex");

      const dbobj: DbObj = {
        tags: countPlayers ? "avatar connected" : "avatar connected superAdmin",
        dbref: count,
        data: { name, password, location: "#1" },
      };

      await dbobjs.insertOne(dbobj);
      const obj = await dbobjs.findOne({ dbref: count });
      if (!obj) {
        ctx.socket.send({ msg: `Error creating avatar!` });
        return;
      }

      const token = sign(
        { dbref: obj.dbref },
        process.env.JWT_SECRET || "secret"
      );

      ctx.socket.send({ msg: `Greetings Program!`, data: { token } });
      ctx.socket.cid = count;
      setTags(obj, "connected");
      emitter.emit<LoginEvent>("login", { dbref: count, socket: ctx.socket });
      force(ctx.socket, "look");
    },
  });

  addCmd({
    name: "connect",
    lock: "!connected",
    hidden: true,
    pattern: /connect\s+(.*)\s+(.*)/,
    handler: async (ctx, args) => {
      let [name, password] = args;

      const found = await dbobjs.findOne({
        $or: [
          { "data.name": new RegExp(name, "i") },
          {
            "data.alias": new RegExp(name, "i"),
          },
        ],
      });

      const hash = createHash("sha512");
      password = hash.update(password).digest("hex");

      if (!found || found.data.password !== password) {
        ctx.socket.send({
          msg: `Either that password is incorrect, or that avatar doesn't exist!`,
        });
        return;
      }

      const token = sign(
        { dbref: found.dbref },
        process.env.JWT_SECRET || "secret"
      );

      ctx.socket.send({
        msg: `Greetings Program!`,
        data: { token },
      });
      ctx.socket.cid = found.dbref;
      await setTags(found, "connected");
      emitter.emit<LoginEvent>("login", { dbref: found.dbref });
      joinChannels(ctx);
      force(ctx.socket, "look");
    },
  });

  addCmd({
    name: "quit",
    description: "Quit the game",
    pattern: /quit/i,
    handler: async (ctx) => {
      await send({
        target: ctx.socket.id,
        msg: `See You, Space Cowboy...`,
        data: { quit: true },
      });
      ctx.socket.disconnect();
      emitter.emit<LogoutEvent>("logout", {
        dbref: ctx.socket.cid,
        socket: ctx.socket,
      });
    },
  });
};
