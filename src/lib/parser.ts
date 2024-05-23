import { Parser } from "@ursamu/parser";

export const parser = new Parser();

parser.addSubs(
  "telnet", // foreground colors
  {
    before: /%[Cc]x/g,
    after: "\u001b[30m",
    strip: "",
  },
  {
    before: /%[Cc]r/g,
    after: "\u001b[31m",
    strip: "",
  },
  {
    before: /%[Cc]g/g,
    after: "\u001b[32m",
    strip: "",
  },
  {
    before: /%[Cc]y/g,
    after: "\u001b[33m",
    strip: "",
  },
  {
    before: /%[Cc]b/g,
    after: "\u001b[34m",
    strip: "",
  },
  {
    before: /%[Cc]m/g,
    after: "\u001b[35m",
    strip: "",
  },
  {
    before: /%[Cc]c/g,
    after: "\u001b[36m",
    strip: "",
  },
  {
    before: /%[Cc]w/g,
    after: "\u001b[37m",
    strip: "",
  }, // Background colors
  {
    before: /%[Cc]X/g,
    after: "\u001b[40m",
    strip: "",
  },
  {
    before: /%[Cc]R/g,
    after: "\u001b[41m",
    strip: "",
  },
  {
    before: /%[Cc]G/g,
    after: "\u001b[42m",
    strip: "",
  },
  {
    before: /%[Cc]Y/g,
    after: "\u001b[43m",
    strip: "",
  },
  {
    before: /%[Cc]B/g,
    after: "\u001b[44m",
    strip: "",
  },
  {
    before: /%[Cc]M/g,
    after: "\u001b[45m",
    strip: "",
  },
  {
    before: /%[Cc]C/g,
    after: "\u001b[46m",
    strip: "",
  },
  {
    before: /%[Cc]W/g,
    after: "\u001b[47m",
    strip: "",
  }, // bold, underline
  {
    before: /%ch/g,
    after: "\u001b[1m",
    strip: "",
  },
  {
    before: /%u/g,
    after: "\u001b[4m",
    strip: "",
  }, // reset, newline, tab
  {
    before: /%cn/g,
    after: "\u001b[0m",
    strip: "",
  },
  {
    before: /%r/g,
    after: "\n",
    strip: "",
  }, // bold, underline
  {
    before: /%ch/g,
    after: "\x1b[1m",
    strip: "",
  },
  {
    before: /%u/g,
    after: "\x1b[4m",
    strip: "",
  }, // reset, newline, tab
  {
    before: /%cn/g,
    after: "\x1b[0m",
    strip: "",
  },
  {
    before: /%r/g,
    after: "\n",
    strip: "",
  },
  {
    before: /%t/g,
    after: "\t",
    strip: "",
  }, // 256 color support
  {
    before: /%c(\d{1,3})/gi,
    after: "\x1b[38;5;$1m",
    strip: "",
  }, // italic
  {
    before: /%i/g,
    after: "\x1b[3m",
    strip: "",
  }
);

parser.addSubs(
  "html",
  { before: /%r/g, after: "<br />" },
  { before: /%b/g, after: "&nbsp;", strip: " " },
  { before: /%t/g, after: "&nbsp;&nbsp;&nbsp;&nbsp;" },
  //color
  {
    before: /%[cx]n/g,
    after: "<span style='color: inherit'></b></i>",
    strip: "",
  },
  { before: /%cx/g, after: "<span style='color: grey'>", strip: "" },
  { before: /%cr/g, after: "<span style='color: red'>", strip: "" },
  { before: /%cg/g, after: "<span style='color: green'>", strip: "" },
  { before: /%cy/g, after: "<span style='color: yellow'>", strip: "" },
  { before: /%cb/g, after: "<span style='color: blue'>", strip: "" },
  { before: /%cm/g, after: "<span style='color: magenta'>", strip: "" },
  { before: /%cc/g, after: "<span style='color: cyan'>", strip: "" },
  { before: /%cw/g, after: "<span style='color: white'>", strip: "" },
  { before: /%ch/g, after: "<b>", strip: "" },
  {
    before: /%u/g,
    after: "<span style='border-bottom: 1px solid'>",
    strip: "",
  },
  { before: /%i/g, after: "<span style='font-style: italic;'>", strip: "" }
);
