import { config } from "dotenv";
import { addCmd } from "../lib";

export default () => {
  addCmd({
    name: "@reboot",
    lock: "superUser",
    pattern: "@reboot",
    catagory: "admin & building",
    description: "Reboot the server",
    helpfile: "Reboot the server",
    handler: async () => {
      config();

      console.log("Rebooting server...");
      process.exit(0);
    },
  });
};
