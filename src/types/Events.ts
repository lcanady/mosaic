import { MuSocket } from "./MuSoket";

export type LoginEvent = {
  dbref: string;
};

export type invalidLoginEvent = {
  socket: MuSocket;
  dbref: string;
};

export type LogoutEvent = {
  dbref: string;
};

export type MoveEvent = {
  dbref: string;
  from: string;
  to: string;
};

export type CmdEvent = {
  dbref: string;
  cmd: string;
  socket: MuSocket;
  args: string[];
};
