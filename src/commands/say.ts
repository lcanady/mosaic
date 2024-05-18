import { addCmd, dbobjs } from "../lib";
import { send } from "../lib/broadcast";
import { parser } from "../lib/parser";
import { target } from "../lib/target";

export default () => {
  addCmd({
    name: "say",
    // pattern should match 'say <text>', and '"<text>' as well.
    pattern: /^(say|")\s?(.*)$/i,
    lock: "connected",
    // description should be under 22 characters
    description: "Say something.",
    helpfile: `
    Say something to the room. This is the most basic form of communication.
    
    Usage:
      say <message>
      " <message>

    Example:
      say Hello, world!
      " Hello, world!
    `,
    handler: async (ctx, args) => {
      if (!ctx.socket.cid) return;
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const data = [];
      const msg = parser.substitute("telnet", args[1]);
      if (msg === "") return;

      if (en.data.location) {
        ctx.socket.broadcast.to(en.data.location).emit("message", {
          target: en.data.location,
          msg: `${en.data.name} says, "${msg}"`,
          data: {},
        });

        ctx.socket.emit("message", {
          target: ctx.socket.cid,
          msg: `You say, "${msg}"`,
          data: {},
        });
      }
    },
  });

  addCmd({
    name: "pose",
    pattern: /^(pose|:|;)\s?(.*)$/i,
    lock: "connected",
    catagory: "Roleplay",
    description: "Pose to the room",
    handler: async (ctx, args) => {
      if (!ctx.socket.cid) return;
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const data = [];
      const msg = parser.substitute("telnet", args[1]);
      if (msg === "") return;

      if (en.data.location) {
        send({
          target: en.data.location,
          msg: `${args[0] === ":" ? en.data.name + " " : en.data.name}${msg}`,
        });
      }
    },
  });

  addCmd({
    name: "emit",
    pattern: /^([@]?emit|\\\\)\s+(.*)$/i,
    lock: "connected",
    catagory: "Roleplay",
    description: "Emit a message.",
    handler: async (ctx, args) => {
      if (!ctx.socket.cid) return;
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const data = [];
      const msg = parser.substitute("telnet", args[1]);
      if (msg === "") return;

      if (en.data.location) {
        send({ target: en.data.location, msg: msg });
      }
    },
  });

  addCmd({
    name: "pemit",
    pattern: /^[@]?pemit\s+(.*)\s*=\s*(.*)/i,
    lock: "connected",
    catagory: "Roleplay",
    description: "Emit to a specific target",
    handler: async (ctx, args) => {
      if (!ctx.socket.cid) return;
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const [tar, msg] = args;
      const targ = await target(en, tar);
      if (!targ) {
        send({ target: ctx.socket.cid, msg: "I don't see that here." });
        return;
      }

      send({ target: targ.dbref, msg: parser.substitute("telnet", msg) });
    },
  });
  addCmd({
    name: "remit",
    pattern: /^[@]?remit\s+(.*)\s*=\s*(.*)/i,
    lock: "connected",
    catagory: "Roleplay",
    // 22 characters
    description: "Emit to a room",
    handler: async (ctx, args) => {
      if (!ctx.socket.cid) return;
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const [tar, msg] = args;
      const targ = await target(en, tar);
      if (!targ) {
        send({ target: ctx.socket.cid, msg: "I don't see that here." });
        return;
      }

      if (!targ.tags.includes("room")) {
        send({ target: ctx.socket.cid, msg: "I don't see that here." });
        return;
      }

      send({
        target: targ.data.location,
        msg: parser.substitute("telnet", msg),
      });
    },
  });

  // addCmd({
  //   name: "page",
  //   // pattern: page/p/pag <target> = <message>
  //   pattern: /^(page|p|pag)\s+(?:(.*)\s*=\s*)?(.*)/i,
  //   lock: "connected",
  //   handler: async (ctx, args) => {
  //     if (!ctx.socket.cid) return;
  //     const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
  //     if (!en) return;

  //     let [_, tar, msg] = args;

  //     tar ||= ""

  //     const targs = tar.split(" ");

  //     // get the target dbrefs from the targets, and map their dbrefs.
  //     const targets = await Promise.all(targs.map(async (t) => {
  //       const targ = await target(en, t);
  //       if (!targ) null;

  //       return targ;
  //     }));

  //     console.log(targets)
  //     const filteredTargets = !targets && en.data.lastpage ? en.data.lastpage : targets.filter(Boolean) as DbObj[];

  //     // if the message starts with : or ;, it's a pose.
  //     // if the message starts with " or nothing, it's a say.
  //     let finalMsg = "";
  //     let senderMsg = "";

  //     switch(true) {
  //       case msg.startsWith(":"):
  //         finalMsg = en.data.name + " " + msg.slice(1);
  //         senderMsg = finalMsg
  //         break;
  //       case msg.startsWith(";"):
  //         finalMsg = en.data.name + msg.slice(1);
  //         senderMsg = finalMsg
  //         break;
  //       case msg.startsWith('"'):
  //         finalMsg = en.data.name + ' pages, "' + msg.slice(1) + '"';
  //         senderMsg = `You page, "${msg.slice(1)}"`;
  //         break;
  //       default:
  //         finalMsg = en.data.name + " pages, " + '"'+ msg + '"';
  //         senderMsg = `You page, "${msg}"`;
  //         break;
  //     }
  //     console.log(filteredTargets)
  //     // send the message to the target(s)
  //     if(filteredTargets.length === 0) {
  //       send({target: ctx.socket.cid, msg: "I don't see that here."});
  //       return;
  //     }

  //     if(filteredTargets.length === 1) {
  //       ctx.socket.broadcast.to(filteredTargets[0].dbref).emit("message", {msg: `from afar, ${finalMsg}`});
  //       send({target: ctx.socket.cid, msg: `To ${filteredTargets[0].data.name}, ${senderMsg}`});
  //       return;
  //     }

  //     if(filteredTargets.length > 1) {
  //       const targetNames = filteredTargets.map((t:DbObj) => `${t.data.name}(${t.data.alias || ""})`).join(", ");
  //       ctx.socket.broadcast.to(filteredTargets.map((t:DbObj) => t.dbref)).emit("message", {msg: `from afar, to (${targetNames}), ${finalMsg}`});
  //       send({target: ctx.socket.cid, msg: `To (${targetNames}), ${senderMsg}`});
  //       return;
  //     }

  //     en.data.lastpage = filteredTargets.map((t:DbObj) => t.dbref);
  //     dbobjs.updateOne({dbref: en.dbref}, {$set: en});

  //   }
  // })
};
