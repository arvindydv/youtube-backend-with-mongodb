import { Router } from "express";
import { toggleSubscription, getUserChannelSubscribers, getAllSubscribedChannels } from "../controllers/subscription.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

// post request
router.route('/toggle-subscription/:channelId').post(verifyJwt, toggleSubscription);

// get request
router.route('/subscribers').get(verifyJwt, getUserChannelSubscribers);
router.route('/subscribed-channel').get(verifyJwt, getAllSubscribedChannels);

export default router;