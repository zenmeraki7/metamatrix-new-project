import express from "express";
import { handleProductWebhook } from "../controllers/webhooks.controller.js";

const router = express.Router();

// Shopify will POST here on product create/update
router.post("/products", handleProductWebhook);

export default router;
