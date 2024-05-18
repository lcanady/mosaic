import { Context } from "./Context";

export interface Command {
  name: string;
  description?: string;
  pattern: RegExp | string;
  lock?: string;
  helpfile?: string;
  hidden?: boolean;
  catagory?: string;
  handler: (ctx: Context, args: string[]) => void | Promise<void>;
}
