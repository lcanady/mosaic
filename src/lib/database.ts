import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { DbObj } from "../types/DbObj";
import { config as conf } from "./config";
import { Channel } from "../types/Channels";
import { Board } from "../types/BBoard";

config();

export const { MONGO_URI } = process.env;
export const db = new MongoClient(MONGO_URI || "").db(conf.get("mudName"));
export const dbobjs = db.collection<DbObj>("objs");
export const channels = db.collection<Channel>("channels");
export const bbs = db.collection<Board>("bbs");
