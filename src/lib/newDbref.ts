import { dbobjs } from "./database";

export const newDbref = async () => {
    return `#${(await dbobjs.countDocuments()) + 1}`;
}