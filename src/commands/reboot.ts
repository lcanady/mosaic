import { config } from "dotenv";
import { addCmd, dbobjs } from "../lib";
import { send } from "../lib/broadcast";
import { io } from "../app";

export default () => {
  addCmd({
    name: "@reboot",
    lock: "superUser",
    pattern: "@reboot",
    catagory: "admin & building",
    description: "Reboot the server",
    helpfile: "Reboot the server",
    handler: async (ctx) => {
      config();

      const en = await dbobjs.findOne({ dbref: ctx.socket.cid });
      if (!en) return;

      io.emit("message", { msg: "Rebooting server..." });
      setTimeout(() => process.exit(0), 1000);
    },
  });
};
