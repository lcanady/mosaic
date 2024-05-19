export interface Channel {
  name: string;
  alias?: string;
  description?: string;
  readLock?: string;
  writeLock?: string;
  joinLock?: string;
  header?: string;
  mask?: string;
}

export interface ChannelEntry {
  channel: string;
  alias: string;
  mask?: string;
  title?: string;
  joined: boolean;
}
