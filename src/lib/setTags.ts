import { WithId } from "mongodb";
import { DbObj } from "../types/DbObj";
import { dbobjs } from "./database";
import { tags } from "./tags";

export const setTags = async (obj: WithId<DbObj>, tgs: string) => {
  const newTags = tags.set(obj.tags || "", obj.data || {}, tgs);
  obj.tags = newTags.tags;
  await dbobjs.updateOne({ _id: obj._id }, { $set: { tags: newTags.tags } });
  return obj;
};
