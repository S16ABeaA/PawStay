import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createStripeCheckoutSession,
  verifyStripeCheckoutSession,
} from "../controllers/paymentController";

const router = Router();

router.use(authMiddleware);

router.post("/stripe/checkout-session", createStripeCheckoutSession);
router.get("/stripe/verify-session", verifyStripeCheckoutSession);

export default router;
