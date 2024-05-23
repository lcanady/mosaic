import { io } from "../app";
import { addCmd, channels, dbobjs, tags } from "../lib";
import { send } from "../lib/broadcast";
import { csend } from "../lib/chennelSend";
import { ljust } from "../lib/formatting";

export default () => {
  addCmd({
    name: "ccreate",
    pattern: /^[@\+]?ccreate\s+(.*)$/i,
    description: "Create a new channel",
    catagory: "channels",
    lock: "connected admin+",
    handler: async (ctx, args) => {
      let [name, alias] = args[0].split("=");
      name = name.trim();
      alias = alias ? alias.trim() : "";

      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const channel = await channels.findOne({
        name: new RegExp(`^${name}$`, "i"),
      });

      if (channel) {
        send({ target: ctx.socket.cid, msg: "Channel already exists" });
        return;
      }

      await channels.insertOne({
        name,
        header: `%ch[${name}]%cn`,
        alias: alias ? alias : undefined,
        joinLock: "admin+", // default to admin+
      });

      const newChan = await channels.findOne({
        name: new RegExp(`^${name}$`, "i"),
      });
      if (!newChan) return;

      send({ target: ctx.socket.cid, msg: `Channel %ch${name}%cn created.` });
      if (newChan.alias) {
        en.data.channels ||= [];
        en.data.channels.push({ name, alias: newChan.alias, joined: true });
        await dbobjs.updateOne({ dbref: ctx.socket.cid }, { $set: en });

        ctx.socket.join(newChan.name);
        send({
          target: ctx.socket.cid,
          msg: `You are now on channel %ch${name}%cn with alias: %ch(${newChan.alias})%cn.`,
        });
        csend(en, newChan, `:has joined the channel.`);
      }
    },
  });

  addCmd({
    name: "cdelete",
    pattern: /^[@\+]?cdelete\s+(.*)$/i,
    description: "Delete a channel",
    lock: "connected admin+",
    catagory: "channels",
    handler: async (ctx, args) => {
      const [name] = args;
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const channel = await channels.findOne({
        name: new RegExp(`^${name}$`, "i"),
      });

      if (!channel) {
        send({ target: ctx.socket.cid, msg: "Channel does not exist" });
        return;
      }

      io.to(channel.name).emit("message", {
        msg: `${channel.header} Channel %ch${name}%cn has been archived.`,
      });
      await channels.deleteOne({ _id: channel._id });
      // delete the channel from all characters.

      const chars = await dbobjs.find({ "data.channels.name": name }).toArray();
      for (const char of chars) {
        char.data.channels = char.data.channels?.filter(
          (c: any) => c.name !== name
        );
        await dbobjs.updateOne({ dbref: char.dbref }, { $set: char });
      }

      send({ target: ctx.socket.cid, msg: `Channel %ch${name}%cn deleted.` });
    },
  });

  addCmd({
    name: "cset",
    pattern: /^[@\+]?cset\s+(.*)$/i,
    description: "Set channel properties",
    lock: "connected admin+",
    catagory: "channels",
    handler: async (ctx, args) => {
      const [name, prop] = args[0].split("=");
      const [key, value] = prop.split(":");

      const channel = await channels.findOne({
        name: new RegExp(`^${name}$`, "i"),
      });

      if (!channel) {
        send({ target: ctx.socket.cid, msg: "Channel does not exist" });
        return;
      }

      switch (key) {
        case "header":
          channel.header = value;
          send({
            target: ctx.socket.cid,
            msg: `Channel header for %ch${channel.name}%cn set to %ch${value}%cn.`,
          });
          break;
        case "alias":
          channel.alias = value;
          send({
            target: ctx.socket.cid,
            msg: `Channel alias for %ch${channel.name}%cn set to %ch${value}%cn.`,
          });
          break;
        case "joinLock":
        case "writeLock":
        case "readLock":
          channel[key] = value;
          send({
            target: ctx.socket.cid,
            msg: `Channel %ch${name}%cn %ch${key}%cn set to %ch${value}%cn.`,
          });
          break;
        case "description":
          channel.description = value;
          send({
            target: ctx.socket.cid,
            msg: `Channel %ch${name}%cn description set.`,
          });
          break;
        default:
          send({ target: ctx.socket.cid, msg: "Invalid key." });
          return;
      }

      await channels.updateOne({ _id: channel._id }, { $set: channel });
    },
  });

  addCmd({
    name: "cjoin",
    pattern: /^[@\+]?cjoin\s+(.*)$/i,
    description: "Join a channel",
    lock: "connected",
    catagory: "channels",
    handler: async (ctx, args) => {
      const [name] = args;
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const parts = name.split("=");

      if (!parts[1])
        return send({ target: ctx.socket.cid, msg: "No alias provided" });

      // find the channel by name
      const channel = await channels.findOne({
        name: new RegExp(`^${parts[0]}$`, "i"),
      });

      if (!channel) {
        send({ target: ctx.socket.cid, msg: "Channel does not exist" });
        return;
      }

      en.data.channels ||= [];
      en.data.channels.push({
        name: channel.name,
        alias: parts[1],
        joined: true,
      });
      await dbobjs.updateOne({ dbref: ctx.socket.cid }, { $set: en });
      ctx.socket.join(channel.name);

      csend(en, channel, `:has joined the channel.`);
      send({
        target: ctx.socket.cid,
        msg: `You are now on channel %ch${name}%cn with alias: %ch(${parts[1]})%cn.`,
      });
    },
  });

  addCmd({
    name: "cleave",
    catagory: "channels",
    pattern: /^[@\+]?cleave\s+(.*)$/i,
    description: "Leave a channel",
    lock: "connected",
    handler: async (ctx, args) => {
      const [name] = args;
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const channel = await channels.findOne({
        name: new RegExp(`^${name}$`, "i"),
      });

      if (!channel) {
        send({ target: ctx.socket.cid, msg: "Channel does not exist" });
        return;
      }

      csend(en, channel, `:has left the channel.`);
      en.data.channels = en.data.channels?.filter(
        (c: any) => c.name !== channel.name
      );
      await dbobjs.updateOne({ dbref: ctx.socket.cid }, { $set: en });

      ctx.socket.leave(channel.name);
    },
  });

  addCmd({
    name: "clist",
    catagory: "channels",
    pattern: /^[@\+]?clist$/i,
    description: "List all joined channels",
    lock: "connected",
    handler: async (ctx) => {
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const channels = en.data.channels || [];
      if (channels.length === 0) {
        send({ target: ctx.socket.cid, msg: "You are not on any channels." });
        return;
      }

      send({
        target: ctx.socket.cid,
        msg: `You are on the following channels:\n\n${channels
          .map((c: any) => `  %ch${c.name}%cn(${c.alias})\n`)
          .join("")}`,
      });
    },
  });

  // clist/all - list all channels available to join by user.
  addCmd({
    name: "clist/all",
    catagory: "channels",
    pattern: /^[@\+]?clist\/all$/i,
    description: "List all available channels",
    lock: "connected",
    handler: async (ctx) => {
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const chans = await channels.find({}).toArray();
      if (chans.length === 0) {
        send({ target: ctx.socket.cid, msg: "No channels available." });
        return;
      }

      send({
        target: ctx.socket.cid,
        msg: `Available channels:\n\n${chans
          .filter((c) => tags.check(en.tags, c.joinLock || ""))
          .map(
            (c: any) =>
              `  %ch${ljust(c.name, 15, "%ch%cx.%cn")}%cn ${ljust(c.description || "", 62, "%ch%cx.%cn")}\n`
          )
          .join("")}`,
      });
    },
  });
};
