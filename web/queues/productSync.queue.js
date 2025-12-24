import { Queue } from "bullmq";
import { connection } from "./redis.js";
import {worker} from "../workers/productSync.worker.js";

export const productSyncQueue = new Queue("product-sync", {
  connection,
});
