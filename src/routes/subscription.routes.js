import { Router } from "express";
import {
  getSubscribersToUser,
  getUserSubscribedChannels,
  toggleSubscription,
} from "../controllers/subscription.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
  
const router = Router();

router.use(verifyJWT);

router.route("/c/:channelId").post(toggleSubscription);

router.route("/c/:channelId").get(getSubscribersToUser); 

router.route("/u/:subscriberId").get(getUserSubscribedChannels);

export default router;
