import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { DbObj } from "../types/DbObj";
import { config as conf } from "./config";
import { Channel } from "../types/Channels";
import { Board } from "../types/BBoard";

config();

const { MONGO_URI } = process.env;
const db = new MongoClient(MONGO_URI || "").db(conf.get("mudName"));
const dbobjs = db.collection<DbObj>("objs");
const channels = db.collection<Channel>("channels");
const bbs = db.collection<Board>("bbs");

export { dbobjs, channels, bbs };
