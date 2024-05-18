import { Application } from "express";
import { readdir } from "fs/promises";
import { join } from "path";

export const plugins = async (dir: string, app?: Application) => {
  const files = await readdir(join(__dirname, "..", dir));
  for (const file of files) {
    if (file.endsWith(".ts")) {
      const mod = await import(`../${dir}/${file}`);
      mod.default(app);
    }
  }
};
