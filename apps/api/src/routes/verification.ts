import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middlewares/errorHandler";
import { requireAdmin } from "../middlewares/auth.middleware";
import { verificationController } from "../controllers/verification.controller";

const router = Router();

// Protect all verification / check-in routes with admin authentication
router.use(requireAdmin);

const getWaitlist = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await verificationController.getWaitingQueue();
  res.status(200).json({
    success: true,
    data: result,
  });
});

router.get("/waiting-queue", getWaitlist);

const handleCheckIn = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const rawInput = req.body.identifier || req.body.qrData || req.body.token || "";
  let identifier = typeof rawInput === "string" ? rawInput.trim() : "";
  let decodedPayload: {
    token?: string;
    name?: string;
    regNo?: string;
    team?: string;
    slot?: string;
    side?: string;
  } | undefined;

  if (identifier.startsWith("{") && identifier.endsWith("}")) {
    try {
      decodedPayload = JSON.parse(identifier);
      if (decodedPayload?.token) {
        identifier = decodedPayload.token;
      }
    } catch {
      // Keep identifier as raw string
    }
  }

  const result = await verificationController.checkInUser(identifier, decodedPayload);

  res.status(200).json({
    success: true,
    message: result.already_checked_in
      ? `Participant is already verified & on waitlist! (${result.arrivalMessage})`
      : `Check-In Confirmed! ${result.arrivalMessage}`,
    data: {
      user: result.user,
      name: result.name,
      regNo: result.regNo,
      isTeam: result.isTeam,
      teamName: result.teamName,
      arrivedCount: result.arrivedCount,
      totalTeamCount: result.totalTeamCount,
      arrivalMessage: result.arrivalMessage,
      slot: result.slot,
      side: result.side,
    },
  });
});

router.post("/check-in", handleCheckIn);
router.post("/checkin", handleCheckIn);

router.get(
  "/:registration_id",
  asyncHandler(async (req: Request<{ registration_id: string }>, res: Response): Promise<void> => {
    const result = await verificationController.verifyRegistration(
      req.params.registration_id,
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  }),
);

export default router;
