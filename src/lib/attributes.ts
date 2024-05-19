import { DbObj } from "../types/DbObj";
import { dbobjs } from "./database";

export interface AttributeOptions {
  target: string;
  name: string;
  value: string;
  setBy?: string;
  tags?: string;
}

export const setAttr = async ({
  target,
  name,
  value,
  setBy,
  tags,
}: AttributeOptions) => {
  const obj = await dbobjs.findOne({ dbref: setBy });
  const tar = await dbobjs.findOne({ dbref: target });
  if (!obj || !tar) return;

  const attr = tar.data.attributes || [];
  const index = attr.findIndex((a) => a.name === name.toLowerCase());
  if (index > -1) {
    attr[index] = {
      name: name.toLowerCase(),
      value,
      setBy: target === setBy || !setBy ? target : setBy,
      tags,
    };
  } else {
    attr.push({ name, value, setBy, tags });
  }
  await dbobjs.updateOne(
    { dbref: setBy },
    {
      $set: { "data.attributes": attr },
    }
  );
};

export const getAttr = (target: DbObj, name: string, def = "") => {
  return (
    target.data.attributes?.find((a) => a.name === name.toLowerCase())?.value ||
    def
  );
};

export const delAttr = async (target: string, name: string) => {
  const tar = await dbobjs.findOne({ dbref: target });
  if (!tar) return;
  const attr = tar.data.attributes || [];
  const index = attr.findIndex((a) => a.name === name.toLowerCase());
  if (index > -1) {
    attr.splice(index, 1);
    await dbobjs.updateOne(
      { dbref: target },
      {
        $set: { "data.attributes": attr },
      }
    );
  }
};
