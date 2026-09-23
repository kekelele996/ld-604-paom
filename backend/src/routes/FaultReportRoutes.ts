import { Router } from "express";
import { faultReportController } from "../controllers/FaultReportController";

const router = Router();

router.get("/", faultReportController.list);
router.get("/:id", faultReportController.detail);
router.post("/", faultReportController.create);

export default router;
