export interface Channel {
  name: string;
  alias?: string;
  description?: string;
  readLock?: string;
  writeLock?: string;
  joinLock?: string;
  header?: string;
  mask?: Boolean;
  title?: Boolean;
}

export interface ChannelEntry {
  name: string;
  alias: string;
  mask?: string;
  title?: string;
  joined: boolean;
}
