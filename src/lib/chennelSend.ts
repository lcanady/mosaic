import { WithId } from "mongodb";
import { io } from "../app";
import { Channel, ChannelEntry } from "../types/Channels";
import { DbObj } from "../types/DbObj";
import { send } from "./broadcast";
import { parser } from "./parser";
import { dbobjs } from ".";
import { force } from "./force";

export const csend = (
  en: DbObj,
  channel: Channel | WithId<Channel>,
  msg: string
) => {
  en.data.channels ||= [];

  const chanEntry = en.data.channels.find((c: ChannelEntry) => {
    return c.name === channel.name;
  });
  if (!chanEntry)
    return send({ target: en.dbref, msg: "You are not on that channel!" });

  const title = channel.title ? chanEntry.title + " " : "";
  const name = channel.mask
    ? chanEntry.mask
      ? chanEntry.mask
      : en.data.name
    : en.data.name;

  let message = "";
  switch (true) {
    case msg.startsWith(":"):
      message = `${channel.header} ${title}${name} ${msg.slice(1)}`;
      break;
    case msg.startsWith(";"):
      message = `${channel.header} ${title}${name}${msg.slice(1)}`;
      break;
    default:
      message = `${channel.header} ${title}${name} says, "${msg}"`;
  }

  io.to(channel.name).emit("message", {
    msg: parser.substitute("telnet", message),
  });
};
