import { Router } from "express";
import { bbs, dbobjs, tags } from "../lib";
import { MuRequest } from "../types/MuReqest";

const router = Router();

router.get("/", async (req: MuRequest, res) => {
  const boards = await bbs.find().toArray();
  let tgs = "";

  if (req.cid) {
    const en = await dbobjs.findOne({ dbref: req.cid });
    if (en && en.data.tags) {
      tgs = en.data.tags;
    }
  }

  const filtered = boards
    .filter((b) => {
      return tags.check(tgs, b.readlock);
    })
    .map((b) => {
      return {
        id: b.id,
        name: b.name,
        description: b.description,
        createdAt: b.createdAt,
        readlock: b.readlock,
        writelock: b.writelock,
        joinlock: b.joinlock,
        messages: b.messages.length,
      };
    });

  res.json(filtered);
});

router.post("/", async (req: MuRequest, res) => {
  if (!req.cid) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const en = await dbobjs.findOne({ dbref: req.cid });

  if (!en || !tags.check(en.data.tags, "admin+")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { name, description, readlock, writelock, joinlock } = req.body;
  const board = await bbs.insertOne({
    id: (await bbs.countDocuments()) + 1,
    name,
    description: description || "",
    readlock: readlock || "",
    writelock: writelock || "",
    joinlock: joinlock || "",
    createdAt: new Date(),
    messages: [],
  });
  res.json(board);
});

router.get("/:id", async (req: MuRequest, res) => {
  const board = await bbs.findOne({ id: parseInt(req.params.id) });

  const en = await dbobjs.findOne({ dbref: req.cid });

  if (!en) return res.status(401).json({ message: "Unauthorized" });
  if (!board) return res.status(404).json({ message: "Not Found" });
  if (!tags.check(en.data.tags, board.readlock))
    return res.status(401).json({ message: "Unauthorized" });

  res.json(board);
});

router.post("/:id", async (req: MuRequest, res) => {
  const board = await bbs.findOne({ id: parseInt(req.params.id) });
  const en = await dbobjs.findOne({ dbref: req.cid });

  if (!en) return res.status(401).json({ message: "Unauthorized" });
  if (!board) return res.status(404).json({ message: "Not Found" });
  if (!tags.check(en.data.tags, board.readlock)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { body, author, title } = req.body;
  const message = {
    id: board.messages.length + 1,
    body,
    title,
    author,
    createdAt: new Date(),
    replies: [],
  };

  board.messages.push(message);

  await bbs.updateOne({ id: board.id }, { $set: board });

  res.json(message);
});

router.post("/:id/:mid", async (req: MuRequest, res) => {
  const board = await bbs.findOne({ id: parseInt(req.params.id) });
  const en = await dbobjs.findOne({ dbref: req.cid });

  if (!en || tags.check(en.data.tags || "", board?.readlock || "")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!board) return res.status(404).json({ message: "Not Found" });

  const { body, author, title } = req.body;
  const message = {
    id: board.messages.length + 1,
    body,
    title,
    author,
    createdAt: new Date(),
    replies: [],
  };

  board.messages.push(message);

  await bbs.updateOne({ id: board.id }, { $set: board });

  res.json(message);
});

router.delete("/:id", async (req: MuRequest, res) => {
  if (!req.cid) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const en = await dbobjs.findOne({ dbref: req.cid });

  if (!en || !tags.check(en.data.tags, "admin+")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const board = await bbs.findOne({ id: parseInt(req.params.id) });

  if (!board) return res.status(404).json({ message: "Not Found" });

  await bbs.deleteOne({ id: board.id });

  res.json({ message: "Deleted" });
});

router.delete("/:id/:mid", async (req: MuRequest, res) => {
  if (!req.cid) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const en = await dbobjs.findOne({ dbref: req.cid });

  if (!en || !tags.check(en.data.tags, "admin+")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const board = await bbs.findOne({ id: parseInt(req.params.id) });

  if (!board) return res.status(404).json({ message: "Not Found" });

  const message = board.messages.find((m) => m.id === parseInt(req.params.mid));

  if (!message) return res.status(404).json({ message: "Not Found" });

  board.messages = board.messages.filter((m) => m.id !== message.id);

  await bbs.updateOne({ id: board.id }, { $set: board });

  res.json({ message: "Deleted" });
});

router.put("/:id", async (req: MuRequest, res) => {
  if (!req.cid) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const en = await dbobjs.findOne({ dbref: req.cid });

  if (!en || !tags.check(en.data.tags, "admin+")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const board = await bbs.findOne({ id: parseInt(req.params.id) });

  if (!board) return res.status(404).json({ message: "Not Found" });

  const { name, description, readlock, writelock, joinlock } = req.body;

  board.name = name || board.name;
  board.description = description || board.description;
  board.readlock = readlock || board.readlock;
  board.writelock = writelock || board.writelock;
  board.joinlock = joinlock || board.joinlock;

  await bbs.updateOne({ id: board.id }, { $set: board });

  res.json(board);
});

router.put("/:id/:mid", async (req: MuRequest, res) => {
  if (!req.cid) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const en = await dbobjs.findOne({ dbref: req.cid });

  if (!en || !tags.check(en.data.tags, "admin+")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const board = await bbs.findOne({ id: parseInt(req.params.id) });

  if (!board) return res.status(404).json({ message: "Not Found" });

  const message = board.messages.find((m) => m.id === parseInt(req.params.mid));

  if (!message) return res.status(404).json({ message: "Not Found" });

  const { title, body, author } = req.body;

  message.title = title || message.title;
  message.body = body || message.body;
  message.author = author || message.author;

  await bbs.updateOne({ id: board.id }, { $set: board });

  res.json(message);
});

export default router;
