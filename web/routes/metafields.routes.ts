// routes/metafields.routes.ts
import express from "express";
import { searchMetafieldKeys } from "../controllers/metafields.controller.js";

const router = express.Router();
router.get("/metafields/keys/search", searchMetafieldKeys);

export default router;
