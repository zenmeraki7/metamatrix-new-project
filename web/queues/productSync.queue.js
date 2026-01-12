import { Queue } from "bullmq";
import { connection } from "./redis.js";

export const productSyncQueue = new Queue("product-sync", {
  connection,
});
