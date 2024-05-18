import { addCmd, dbobjs } from "../lib";
import { send } from "../lib/broadcast";
import { newDbref } from "../lib/newDbref";
import { DbObj } from "../types/DbObj";

export default () => {
  addCmd({
    name: "@dig",
    // @dig <room name>[=<to>][,<from>>]
    pattern: /^@dig\s(.*)$/,
    description: "Dig a Room",
    catagory: "admin & building",
    helpfile: `
        
        create a new room and optionally connect it to the current room.
        
        Usage: @dig <room name>[=<to>][,<from>>]

        Example:
        @dig room1 =north, south

        This will create a new room named room1 and connect it to the current 
        room to the north and south.`,
    handler: async (ctx, args) => {
      const [roomName, exits] = args[0].split("=");
      const [to, from] = exits.split(",");
      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      const currRoom = await dbobjs.findOne({ dbref: en.data.location });
      if (!currRoom) {
        send({ target: ctx.socket.id, msg: "Error finding current room!" });
        return;
      }

      const room: DbObj = {
        dbref: await newDbref(),
        tags: "room",
        description: "",
        data: {
          name: roomName,
        },
      };

      await dbobjs.insertOne(room);

      if (!room) {
        send({ target: ctx.socket.id, msg: "Error creating room!" });
        return;
      }

      send({ target: ctx.socket.id, msg: `Room %ch${roomName}%cn created.` });

      if (to) {
        const toExit: DbObj = {
          dbref: await newDbref(),
          tags: "exit",
          description: "",
          data: {
            name: to,
            destination: room.dbref,
            location: currRoom.dbref,
          },
        };

        const newToExit = await dbobjs.insertOne(toExit);
        if (!newToExit) {
          send({ target: ctx.socket.id, msg: "Error creating exit!" });
          return;
        }

        send({
          target: ctx.socket.id,
          msg: `Exit %ch${to.split(";")[0]}%cn opened.`,
        });
      }

      if (from) {
        const fromExit: DbObj = {
          dbref: await newDbref(),
          tags: "exit",
          description: "",
          data: {
            name: from,
            destination: currRoom.dbref,
            location: room.dbref,
          },
        };

        const newFromExit = await dbobjs.insertOne(fromExit);
        if (!newFromExit) {
          send({ target: ctx.socket.id, msg: "Error creating exit!" });
          return;
        }

        send({
          target: ctx.socket.id,
          msg: `Exit %ch${from.split(";")[0]}%cn opened.`,
        });
      }
    },
  });
};
