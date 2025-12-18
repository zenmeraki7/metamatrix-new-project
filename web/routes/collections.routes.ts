// routes/collections.routes.ts
import express from "express";
import { searchCollections } from "../controllers/collections.controller.js";

const router = express.Router();
router.get("/collections/search", searchCollections);

export default router;
