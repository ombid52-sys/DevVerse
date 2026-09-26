import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import {
  User,
  Application,
  Favorite,
  Collection as AppCollection,
  ActivityLog,
  VerificationCode,
} from "@/types";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _inMemoryDb: InMemoryDb | undefined;
}

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/devverse";
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

// Lightweight in-memory fallback for local development or testing environments when MongoDB daemon is not running
class InMemoryCollection<T extends { _id?: ObjectId | string }> {
  private items: Map<string, T> = new Map();

  async findOne(query: Record<string, unknown>): Promise<T | null> {
    for (const item of this.items.values()) {
      if (this.matches(item, query)) {
        return JSON.parse(JSON.stringify(item));
      }
    }
    return null;
  }

  async find(query: Record<string, unknown> = {}, options: { sort?: Record<string, number>; skip?: number; limit?: number } = {}) {
    let results: T[] = [];
    for (const item of this.items.values()) {
      if (this.matches(item, query)) {
        results.push(JSON.parse(JSON.stringify(item)));
      }
    }

    if (options.sort) {
      const [field, direction] = Object.entries(options.sort)[0] || [];
      if (field) {
        results.sort((a: any, b: any) => {
          const valA = a[field];
          const valB = b[field];
          if (valA < valB) return direction === 1 ? -1 : 1;
          if (valA > valB) return direction === 1 ? 1 : -1;
          return 0;
        });
      }
    }

    if (typeof options.skip === "number") {
      results = results.slice(options.skip);
    }
    if (typeof options.limit === "number") {
      results = results.slice(0, options.limit);
    }

    return {
      toArray: async () => results,
    };
  }

  async countDocuments(query: Record<string, unknown> = {}): Promise<number> {
    let count = 0;
    for (const item of this.items.values()) {
      if (this.matches(item, query)) {
        count++;
      }
    }
    return count;
  }

  async insertOne(doc: T): Promise<{ insertedId: ObjectId | string; acknowledged: boolean }> {
    const id = doc._id ? doc._id.toString() : new ObjectId().toString();
    const itemWithId = { ...doc, _id: id };
    this.items.set(id, itemWithId as T);
    return { insertedId: id, acknowledged: true };
  }

  async updateOne(filter: Record<string, unknown>, update: { $set?: Record<string, unknown>; $push?: Record<string, unknown>; $pull?: Record<string, unknown> }): Promise<{ matchedCount: number; modifiedCount: number }> {
    for (const [id, item] of this.items.entries()) {
      if (this.matches(item, filter)) {
        const updated = { ...item };
        if (update.$set) {
          Object.assign(updated, update.$set);
        }
        if (update.$push) {
          for (const [key, val] of Object.entries(update.$push)) {
            const arr = ((updated as any)[key] || []) as unknown[];
            arr.push(val);
            (updated as any)[key] = arr;
          }
        }
        if (update.$pull) {
          for (const [key, val] of Object.entries(update.$pull)) {
            let arr = ((updated as any)[key] || []) as unknown[];
            arr = arr.filter((x: any) => ((x as any)?._id || x)?.toString() !== ((val as any)?._id || val)?.toString());
            (updated as any)[key] = arr;
          }
        }
        this.items.set(id, updated);
        return { matchedCount: 1, modifiedCount: 1 };
      }
    }
    return { matchedCount: 0, modifiedCount: 0 };
  }

  async deleteOne(filter: Record<string, unknown>): Promise<{ deletedCount: number }> {
    for (const [id, item] of this.items.entries()) {
      if (this.matches(item, filter)) {
        this.items.delete(id);
        return { deletedCount: 1 };
      }
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter: Record<string, unknown>): Promise<{ deletedCount: number }> {
    let deletedCount = 0;
    for (const [id, item] of this.items.entries()) {
      if (this.matches(item, filter)) {
        this.items.delete(id);
        deletedCount++;
      }
    }
    return { deletedCount };
  }

  async createIndex() {
    return "index_created";
  }

  private matches(item: any, query: Record<string, any>): boolean {
    for (const [key, expected] of Object.entries(query)) {
      if (key === "$or" && Array.isArray(expected)) {
        const orMatch = expected.some((subQuery) => this.matches(item, subQuery));
        if (!orMatch) return false;
        continue;
      }
      if (key === "$and" && Array.isArray(expected)) {
        const andMatch = expected.every((subQuery) => this.matches(item, subQuery));
        if (!andMatch) return false;
        continue;
      }

      const itemVal = item[key];
      if (expected && typeof expected === "object" && !(expected instanceof ObjectId) && !(expected instanceof Date)) {
        if ("$regex" in expected) {
          const reg = new RegExp(expected.$regex, expected.$options || "i");
          if (!reg.test(String(itemVal || ""))) return false;
        } else if ("$in" in expected && Array.isArray(expected.$in)) {
          const inArr = expected.$in.map((x: any) => (x instanceof ObjectId ? x.toString() : String(x)));
          const current = itemVal instanceof ObjectId ? itemVal.toString() : String(itemVal);
          if (!inArr.includes(current)) return false;
        } else if ("$ne" in expected) {
          if (String(itemVal) === String(expected.$ne)) return false;
        }
      } else {
        const expectedStr = expected instanceof ObjectId ? expected.toString() : String(expected ?? "");
        const itemValStr = itemVal instanceof ObjectId ? itemVal.toString() : String(itemVal ?? "");
        if (expectedStr !== itemValStr) return false;
      }
    }
    return true;
  }
}

class InMemoryDb {
  users = new InMemoryCollection<User>();
  applications = new InMemoryCollection<Application>();
  favorites = new InMemoryCollection<Favorite>();
  collections = new InMemoryCollection<AppCollection>();
  activityLogs = new InMemoryCollection<ActivityLog>();
  verificationCodes = new InMemoryCollection<VerificationCode>();

  collection(name: string): any {
    return (this as any)[name] || new InMemoryCollection();
  }
}

export async function getDb(): Promise<Db | InMemoryDb> {
  const isProduction = process.env.NODE_ENV === "production";

  // In production, strictly disallow any in-memory database localization
  if (!isProduction && global._inMemoryDb) {
    return global._inMemoryDb;
  }

  if (isProduction && !process.env.MONGODB_URI) {
    throw new Error(
      "[DevVerse DB Fatal] MONGODB_URI is required in production environment. Local database fallbacks are disabled."
    );
  }

  try {
    if (!clientPromise) {
      const targetUri = process.env.MONGODB_URI || uri;
      client = new MongoClient(targetUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      clientPromise = client.connect();
    }
    const c = await clientPromise;
    return c.db("devverse");
  } catch (err: any) {
    if (isProduction) {
      console.error(`[DevVerse DB Fatal] Failed to connect to MongoDB Atlas in production (${err.message})`);
      throw new Error(`Database connection failure: ${err.message}. Local in-memory fallback is disabled in production.`);
    }
    console.warn(
      `[DevVerse DB] Notice: MongoDB connection failed (${err.message}). Using resilient in-memory storage adapter for local operation.`
    );
    if (!global._inMemoryDb) {
      global._inMemoryDb = new InMemoryDb();
    }
    return global._inMemoryDb;
  }
}

export async function getCollections() {
  const db = await getDb();
  return {
    users: (db instanceof InMemoryDb ? db.users : db.collection<User>("users")) as any,
    applications: (db instanceof InMemoryDb ? db.applications : db.collection<Application>("applications")) as any,
    favorites: (db instanceof InMemoryDb ? db.favorites : db.collection<Favorite>("favorites")) as any,
    collections: (db instanceof InMemoryDb ? db.collections : db.collection<AppCollection>("collections")) as any,
    activityLogs: (db instanceof InMemoryDb ? db.activityLogs : db.collection<ActivityLog>("activityLogs")) as any,
    verificationCodes: (db instanceof InMemoryDb ? db.verificationCodes : db.collection<VerificationCode>("verificationCodes")) as any,
  };
}

let indexesEnsured = false;
export async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  try {
    const { users, applications, favorites, collections, activityLogs } = await getCollections();

    await Promise.allSettled([
      users.createIndex({ email: 1 }, { unique: true }),
      users.createIndex({ username: 1 }, { unique: true }),
      applications.createIndex({ slug: 1 }, { unique: true }),
      applications.createIndex({ ownerId: 1 }),
      applications.createIndex({ visibility: 1 }),
      applications.createIndex({ category: 1 }),
      applications.createIndex({ platform: 1 }),
      favorites.createIndex({ userId: 1, applicationId: 1 }, { unique: true }),
      collections.createIndex({ ownerId: 1 }),
      activityLogs.createIndex({ timestamp: -1 }),
      activityLogs.createIndex({ actorId: 1 }),
    ]);
    indexesEnsured = true;
  } catch (err: any) {
    console.warn("[DevVerse DB] Warning: ensureIndexes encountered error:", err.message);
  }
}

// Utility to safely convert string to ObjectId when needed
export function toObjectId(id: string | ObjectId): ObjectId | string {
  if (id instanceof ObjectId) return id;
  if (ObjectId.isValid(id) && id.length === 24) {
    try {
      return new ObjectId(id);
    } catch {
      return id;
    }
  }
  return id;
}
