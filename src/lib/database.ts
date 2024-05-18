import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { DbObj } from "../types/DbObj";

config();

const { MONGO_URI } = process.env;
const db = new MongoClient(MONGO_URI || "").db("mosaic");
const dbobjs = db.collection<DbObj>("objs");

export { db, dbobjs };
