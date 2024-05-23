import { WithId } from "mongodb";
import { Context } from "../types/Context";
import { channels, db, dbobjs } from "./database";

import { Channel } from "../types/Channels";
import { tags } from "./tags";
import { send } from "./broadcast";
import { csend } from "./chennelSend";

export const joinChannels = async ({ socket }: Context) => {
  const en = await dbobjs.findOne({ dbref: socket.cid });

  if (!en) return;

  socket.join(en.dbref);

  if (en.data.location) {
    socket.join(en.data.location);
  }

  const channs = await channels.find({}).toArray();
  const filter = channs.filter((channel) => {
    return channel.alias;
  }) as WithId<Channel>[];

  for (let channel of filter) {
    if (
      !en.data.channels?.find((c) => c.name === channel.name) &&
      tags.check(en.tags, channel.joinLock || "")
    ) {
      en.data.channels ||= [];
      en.data.channels?.push({
        name: channel.name,
        alias: channel.alias!,
        joined: true,
      });

      await dbobjs.updateOne({ _id: en._id }, { $set: en });

      socket.join(channel.name);

      send({
        target: en.dbref,
        msg: `You are now on channel %ch${channel.name}%cn with alias: %ch(${channel.alias})%cn.`,
      });

      csend(en, channel, `:has joined the channel.`);
    }
  }

  en.data.channels?.forEach((channel) => {
    // if enactor has joined the channel, join the socket to the channel
    if (channel.joined && en.tags.includes("connected")) {
      socket.join(channel.name);
    }
  });
};
