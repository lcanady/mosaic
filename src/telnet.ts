import { createServer } from "net";
import { io } from "socket.io-client";

const server = createServer(async (socket) => {
  // create a utf-8 connection to the server.
  socket.setEncoding("utf-8");
  let token = "";
  const sock = io("http://localhost:3000");
  sock.on("connect", () => {
    if (!token) {
      sock.send({ msg: "", data: { welcome: true } });
    }
  });

  socket.on("data", (data) => {
    const msg = {
      msg: data.toString().trim(),
      data: { token, type: "telnet" },
    };
    sock.send(msg);
  });

  sock.on("message", (msg) => {
    if (msg.data?.token) token = msg.data.token;
    socket.write(msg.msg + "\r\n");
    if (msg.data?.quit) return socket.end();
  });

  sock.io.on("reconnect", () => {
    socket.write("Reconnected to the server.\r\n");
    sock.send({ msg: "", data: { token } });
  });

  socket.on("end", () => {
    sock.send({ msg: "", data: { quit: true } });
  });
});

server.listen(6000, async () => {
  console.log("Telnet server listening on port 6000");
});
