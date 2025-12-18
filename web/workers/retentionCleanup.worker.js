// workers/retentionCleanup.worker.js
import mongoose from "mongoose";
import { Shop, ChangeSet, AuditLog, WebhookEvent } from "../models/index.js";

/**
 * Retention cleanup worker:
 * - ChangeSet: per-shop rollbackRetentionDays
 * - AuditLog: per-shop auditRetentionDays
 * - WebhookEvent: fixed retention or per-shop (configurable)
 *
 * Safe to run multiple times; deletes are idempotent.
 */

function daysAgoUtc(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

async function deleteInBatches(Model, filter, batchSize = 50_000) {
  // Avoid huge deleteMany locking/long ops on very large datasets:
  // Use _id batching (requires index on createdAt; recommended).
  let totalDeleted = 0;

  while (true) {
    const ids = await Model.find(filter, { _id: 1 })
      .sort({ _id: 1 })
      .limit(batchSize)
      .lean();

    if (!ids.length) break;

    const res = await Model.deleteMany({ _id: { $in: ids.map((x) => x._id) } });
    totalDeleted += res.deletedCount || 0;

    // If less than batchSize were found, we’re done.
    if (ids.length < batchSize) break;
  }

  return totalDeleted;
}

export async function runRetentionCleanup({
  webhookRetentionDays = 14, // you can override or read from Shop.settings if you add it
  batchSize = 50_000,
  shopBatchSize = 500,
  dryRun = false,
} = {}) {
  const startedAt = new Date();
  const summary = {
    startedAt,
    finishedAt: null,
    shopsProcessed: 0,
    changeSetsDeleted: 0,
    auditLogsDeleted: 0,
    webhookEventsDeleted: 0,
    errors: [],
  };

  // Process shops in pages to keep memory stable
  let lastId = null;

  while (true) {
    const shopQuery = lastId ? { _id: { $gt: lastId } } : {};
    const shops = await Shop.find(shopQuery, {
      _id: 1,
      shopDomain: 1,
      "settings.rollbackRetentionDays": 1,
      "settings.auditRetentionDays": 1,
      uninstalledAt: 1,
    })
      .sort({ _id: 1 })
      .limit(shopBatchSize)
      .lean();

    if (!shops.length) break;
    lastId = shops[shops.length - 1]._id;

    for (const shop of shops) {
      summary.shopsProcessed += 1;

      const rollbackDays = Math.max(1, shop?.settings?.rollbackRetentionDays ?? 30);
      const auditDays = Math.max(1, shop?.settings?.auditRetentionDays ?? 90);

      const changeSetCutoff = daysAgoUtc(rollbackDays);
      const auditCutoff = daysAgoUtc(auditDays);
      const webhookCutoff = daysAgoUtc(webhookRetentionDays);

      try {
        if (!dryRun) {
          // ChangeSet retention
          summary.changeSetsDeleted += await deleteInBatches(
            ChangeSet,
            { shopId: shop._id, createdAt: { $lt: changeSetCutoff } },
            batchSize
          );

          // AuditLog retention
          summary.auditLogsDeleted += await deleteInBatches(
            AuditLog,
            { shopId: shop._id, at: { $lt: auditCutoff } },
            batchSize
          );

          // WebhookEvent retention (fixed)
          summary.webhookEventsDeleted += await deleteInBatches(
            WebhookEvent,
            { shopId: shop._id, receivedAt: { $lt: webhookCutoff } },
            batchSize
          );
        }
      } catch (err) {
        summary.errors.push({
          shopId: String(shop._id),
          shopDomain: shop.shopDomain,
          message: err?.message || "Unknown error",
        });
      }
    }
  }

  summary.finishedAt = new Date();
  return summary;
}

/**
 * CLI entrypoint (optional): `node workers/retentionCleanup.worker.js`
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const MONGO_URL = process.env.MONGO_URI;
  if (!MONGO_URL) {
    console.error("Missing MONGO_URI");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URL, { autoIndex: false });
    const report = await runRetentionCleanup({
      webhookRetentionDays: Number(process.env.WEBHOOK_RETENTION_DAYS || 14),
      dryRun: process.env.DRY_RUN === "1",
    });

    console.log(JSON.stringify(report, null, 2));
    process.exit(report.errors.length ? 2 : 0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}
