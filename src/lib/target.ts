import { DbObj } from "../types/DbObj";
import { dbobjs } from "./database";

export const target = async (en: DbObj, target: string) => {
  switch (target.toLowerCase()) {
    case "me":
      return en;
    case "here":
      return await dbobjs.findOne({ dbref: en.data.location });
    case "": // if no target is given return the location of the entity.
      return await dbobjs.findOne({ dbref: en.data.location });
    default:
      return await dbobjs.findOne({
        $or: [{ dbref: target }, { "data.name": new RegExp(target, "i") }],
      });
  }
};
