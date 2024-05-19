import { exec } from "child_process";
import { addCmd } from "../lib";
import { send } from "../lib/broadcast";
import { force } from "../lib/force";

export default () => {
  addCmd({
    name: "@upgrade",
    lock: "connected superUser",
    pattern: /^@upgrade$/,
    catagory: "Super Users",
    description: "Upgrade the server",
    handler: async (ctx) => {
      send({ target: ctx.socket.cid, msg: "Upgrading the server..." });
      exec("git pull", (err, stdout, stderr) => {
        if (err) {
          console.error(err);
          send({ target: ctx.socket.cid, msg: "Error upgrading the server." });
          return;
        }
        send({
          target: ctx.socket.cid,
          msg: "Server upgraded successfully, rebooting...",
        });
        console.log(stdout);
        console.log(stderr);
        force(ctx.socket, "@reboot");
      });
    },
  });
};
