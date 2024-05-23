export interface Message {
  id: number;
  title: string;
  body: string;
  author: string;
  createdAt: Date;
  replies: Message[];
}

export interface Board {
  id: number;
  name: string;
  description: string;
  messages: Message[];
  createdAt: Date;
  readlock: string;
  writelock: string;
  joinlock: string;
}
