import express from "express";
import { readFile } from "fs/promises";
import { createServer } from "http";
import { join } from "path";
import { Server } from "socket.io";
import { plugins } from "./lib/Plugins";
import { commandHandler } from "./lib/commandParser";
import { MuSocket } from "./types/MuSoket";
import { JwtPayload, verify } from "jsonwebtoken";
import { dbobjs } from "./lib/database";
import { DbObj } from "./types/DbObj";
import { createHash } from "crypto";
import { emitter } from "./lib/emitter";
import { send } from "./lib/broadcast";
import { config } from "dotenv";
import "./handlers";

config();
const app = express();

app.use(express.static("public"));

const server = createServer(app);
const io = new Server(server);

io.on("connection", async (socket: MuSocket) => {
  let token = {} as JwtPayload;
  const welcome = await readFile(
    join(__dirname, "../text/connect.txt"),
    "utf-8"
  );

  socket.on("message", async (msg) => {
    const data = msg;

    if (data.data?.welcome) return send({ target: socket.id, msg: welcome });

    if (data.data?.token) {
      token = verify(
        data.data.token,
        process.env.JWT_SECRET || "secret"
      ) as JwtPayload;
      socket.cid = token.dbref;
      socket.join(token.dbref);

      const en = await dbobjs.findOne({ dbref: token.dbref });
      if (en && en.data.location) {
        socket.join(en.data.location);
      }
    }

    if (data.data?.quit) return socket.disconnect();

    const ctx = { socket, msg: data.msg, data: data.data || {} };
    if (data.msg) commandHandler(ctx);
  });

  socket.on("disconnect", async () => {
    if (socket.cid) {
      const en = await dbobjs.findOne({ dbref: socket.cid });
      if (en) {
        en.tags = en.tags.replace(/ connected/g, "");
        await dbobjs.updateOne({ _id: en._id }, { $set: en });
      }
    }
  });
});

server.listen(3000, async () => {
  await plugins("./commands");

  // find all rooms with the tag "room" in their tags lsit.
  const rooms = await dbobjs.find({ tags: /room/ }).toArray();
  if (!rooms.length) {
    const room: DbObj = {
      dbref: "#1",
      tags: "room",
      data: { name: "Limbo" },
    };

    await dbobjs.insertOne(room);
  }

  const userCount = await dbobjs.countDocuments({ tags: /avatar/ });
  if (!userCount) {
    const hash = createHash("sha512");

    const dbobj: DbObj = {
      tags: "avatar connected superAdmin",
      dbref: "#2",
      data: {
        name: "Wizard",
        password: hash.update("Potrzebie").digest("hex"),
        location: "#1",
      },
    };

    await dbobjs.insertOne(dbobj);
  }

  console.log("Server started: listening on *:3000");
  emitter.emit("startup");
});

process.on("SIGINT", async () => {
  // remove connected tag from all connected users.
  // tags: "foo bar baz connected"
  // tags after: "foo bar baz"

  const connected = await dbobjs.find({ tags: /connected/ }).toArray();
  for (const user of connected) {
    user.tags = user.tags.replace(/ connected/g, "");
    await dbobjs.updateOne({ _id: user._id }, { $set: user });
  }

  io.close();
  process.exit();
});

export { app, io };
