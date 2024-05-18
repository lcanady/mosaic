import { config } from "dotenv";
import { addCmd, dbobjs } from "../lib";
import { send } from "../lib/broadcast";

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
      if (!en.isSuperUser) return;

      if (process.env.NODE_ENV === "production") {
        send({ msg: "Rebooting server" });
        setTimeout(() => process.exit(0), 1000);
      }
    },
  });
};
