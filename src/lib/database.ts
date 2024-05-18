import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { DbObj } from "../types/DbObj";
import { config as conf } from "./config";

config();

const { MONGO_URI } = process.env;
const db = new MongoClient(MONGO_URI || "").db(conf.get("mudName"));
const dbobjs = db.collection<DbObj>("objs");

export { db, dbobjs };
