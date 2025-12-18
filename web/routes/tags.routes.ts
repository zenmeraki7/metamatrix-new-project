// routes/tags.routes.ts
import express from "express";
import { searchTags } from "../controllers/tags.controller.js";
const router = express.Router();
router.get("/tags/search", searchTags);
export default router;
