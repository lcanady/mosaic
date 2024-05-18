import { DbObj } from "../types/DbObj";
import { tags } from "./tags";

export const canEdit = (en: DbObj, tar: DbObj) => {
  return en.dbref === tar.dbref || (tags.lvl(en.tags) || 0) > 0;
};

export const displayName = (en: DbObj, tar: DbObj) => {
  if (canEdit(en, tar)) {
    return `${tar.data?.moniker || tar.data.name}(${tar.dbref}${
      tags.codes(tar.tags)
    })`;
  }

  return tar.data?.moniker || tar.data.name;
};
