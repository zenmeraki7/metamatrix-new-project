import { Queue } from "bullmq";
import { connection } from "./redis.js";

export const collectionSyncQueue = new Queue("collection-sync", {
  connection,
});
