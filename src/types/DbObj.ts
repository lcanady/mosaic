import { Document, InsertOneResult, OptionalId, UpdateResult } from "mongodb";
import { Attribute } from "./Attribute";
import { AttributeOptions, db, dbobjs, setTags } from "../lib";
import { tags as tagList } from "../lib/tags";
import { ChannelEntry } from "./Channels";

export interface DbObjData {
  name?: string;
  password?: string;
  description?: string;
  location?: string;
  attributes?: Attribute[];
  channels?: ChannelEntry[];
  [key: string]: any;
}

export interface DbObj extends OptionalId<Document> {
  dbref: string;
  tags: string;
  data: DbObjData;
}

export class DbObjInstance implements DbObj {
  private _dbref: string;
  private _tags: string;
  private _data: DbObjData;

  constructor({ dbref, tgs, data }: DbObj) {
    this._dbref = dbref || "";
    this._tags = tgs || "";
    this._data = data || {};
  }

  static async create(data: DbObj): Promise<InsertOneResult<DbObj>> {
    return Promise.resolve(dbobjs.insertOne(data));
  }

  static get(dbref: string): Promise<DbObj | null> {
    return Promise.resolve(
      dbobjs.findOne({
        $or: [
          { dbref },
          { name: new RegExp(dbref, "i") },
          { alias: new RegExp(dbref, "i") },
        ],
      })
    );
  }

  save(): Promise<UpdateResult<DbObj>> {
    return Promise.resolve(dbobjs.updateOne({ dbref: this._dbref }, this));
  }

  get attributes(): Attribute[] {
    return this._data.attributes || [];
  }

  getAttribute(name: string): Attribute | null {
    return this._data.attributes?.find((attr) => attr.name === name) || null;
  }

  attribute(options: AttributeOptions): void {
    const attr = this.getAttribute(options.name);
    if (attr) {
      // if no value is passed, delete the attribute
      if (options.value === undefined) {
        this._data.attributes = this._data.attributes?.filter(
          (a) => a.name !== options.name
        );
      } else {
        attr.value = options.value;
      }
    } else {
      if (options.value === undefined) return;
      this._data.attributes = this._data.attributes || [];
      this._data.attributes.push(options);
    }
  }

  get dbref(): string {
    return this._dbref;
  }

  set dbref(dbref: string) {
    this._dbref = dbref;
  }

  get data(): DbObjData {
    return this._data;
  }

  get tags(): string {
    return this.tags;
  }

  set tags(tags: string) {
    const ret = tagList.set(this._tags, this._data, tags);
    this._tags = ret.tags;
    this._data = ret.data;
  }

  get description(): string {
    return this._data.description || "You see nothing special.";
  }

  set description(description: string) {
    this._data.description = description;
  }

  get location(): string {
    return this._data.location || "";
  }

  set location(location: string) {
    this._data.location = location;
  }

  get name(): string {
    return this._data.name || "";
  }

  set name(name: string) {
    this._data.name = name;
  }
}
