import express from "express";
import { readFile } from "fs/promises";
import { createServer } from "http";
import { join } from "path";
import { Server } from "socket.io";
import { plugins } from "./lib/Plugins";
import { MuSocket } from "./types/MuSoket";
import { JwtPayload, verify } from "jsonwebtoken";
import { channels, dbobjs } from "./lib/database";
import { DbObj } from "./types/DbObj";
import { createHash } from "crypto";
import { emitter } from "./lib/emitter";
import { send } from "./lib/broadcast";
import { config } from "dotenv";
import { config as conf } from "./lib/config";
import "./handlers";
import { LogoutEvent } from "./types/Events";
import { engine } from "./lib/middlewareEngine";
import { createEngine } from "express-preact-views";
import { auth } from "./middleware/auth";
import bbsRouter from "./routes/bbs";
import { joinChannels } from "./lib/joinChannels";

config();
const app = express();

app.use(express.static("public"));
app.get("/client", (req, res) => {
  res.render("client");
});

app.set("views", __dirname + "/views");
app.set("view engine", "jsx");
app.engine("jsx", createEngine());

// dynamically load all routes.
app.use(auth);
app.use("/api/vi/bbs/", bbsRouter);

const server = createServer(app);
const io = new Server(server);

io.on("connection", async (socket: MuSocket) => {
  let token = {} as JwtPayload;
  let welcome = "";
  try {
    welcome = await readFile(join(__dirname, "../text/connect.txt"), "utf-8");
  } catch (error) {
    welcome = await readFile(
      join(__dirname, "../text/connect_default.txt"),
      "utf-8"
    );
  }

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
      socket.cid = en?.dbref;

      if (en && en.data.location) {
        socket.join(en.data.location);
      }

      if (en && en.data.channels) {
        en.data.channels?.forEach((channel) => {
          // if enactor has joined the channel, join the socket to the channel
          if (channel.joined && en.tags.includes("connected")) {
            socket.join(channel.name);
          }
        });
      }

      const ctx = { socket, msg: data.msg, data: data.data || {} };
    }

    if (data.data?.quit) return socket.disconnect();

    const ctx = { socket, msg: data.msg, data: data.data || {} };
    joinChannels(ctx);
    if (data.msg && msg !== " ") engine.execute(ctx);
  });

  socket.on("disconnect", async () => {
    if (socket.cid) {
      const en = await dbobjs.findOne({ dbref: socket.cid });
      if (en) {
        en.tags = en.tags.replace(/ connected/g, "").replace(/\s+/g, " ");
        await dbobjs.updateOne({ _id: en._id }, { $set: en });

        emitter.emit<LogoutEvent>("logout", {
          dbref: en.dbref,
          socket: socket,
        });
      }
    }
  });
});

server.listen(conf.get("mudPort"), async () => {
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

  // add some channels.
  const chans = await channels.find().toArray();
  if (!chans.length) {
    await channels.insertMany([
      {
        name: "Public",
        alias: "pub",
        header: "%ch%cb[Public]%cn",
        mask: false,
        title: false,
      },
      {
        name: "Admin",
        alias: "ad",
        header: "%ch%cy[Admin]%cn",
        mask: true,
        title: true,
        readLock: "admin+",
        writeLock: "admin+",
        joinLock: "admin+",
      },
      {
        name: "Newbie",
        alias: "new",
        header: "%ch%cc[Newbie]%cn",
        mask: false,
        title: false,
      },
    ]);
  }

  const userCount = await dbobjs.countDocuments({ tags: /avatar/ });
  if (!userCount) {
    const hash = createHash("sha512");

    const dbobj: DbObj = {
      tags: "avatar connected superUser",
      dbref: "#2",
      data: {
        name: "Wizard",
        password: hash.update("Potrzebie").digest("hex"),
        location: "#1",
      },
    };

    await dbobjs.insertOne(dbobj);
  }

  setInterval(() => {
    //check for dead sockets and disconnect them.
    for (const [id, socket] of io.sockets.sockets) {
      if (socket.connected === false) {
        socket.disconnect();
      }
    }
  }, 10000);

  console.log(`Server started on port ${conf.get("mudPort")}`);
  emitter.emit("startup");
});

process.on("SIGINT", async () => {
  // remove connected tag from all connected users.
  // tags: "foo bar baz connected"
  // tags after: "foo bar baz"

  const connected = await dbobjs.find({ tags: /connected/ }).toArray();
  for (const user of connected) {
    user.tags = user.tags.replace(/ connected/g, "").replace(/\s+/g, " ");
    await dbobjs.updateOne({ _id: user._id }, { $set: user });
  }

  io.close();
  process.exit();
});

export { app, io };

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
