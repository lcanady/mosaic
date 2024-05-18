import { Tags } from "@digibear/tags";

export const tags = new Tags({
  name: "superUser",
  code: "SA",
  lock: "superUser",
  lvl: 10,
},
{
  name: "admin",
  code: "A",
  lock: "superUser",
  lvl: 9,
},
{
  name: "builder",
  code: "B",
  lock: "admin+",
  lvl: 8,
},
{
  name: "avatar",
  code: "a",
  lock: "superUser",
}, {
  name: "connected",
  code: "c",
  lock: "superUser",
}, {
  name: "room",
  code: "R",
  lock: "superUser",
},{
  name: "exit",
  code: "E",
  lock: "superUser",
});
