import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  acceptFriendRequest,
  deleteAccount,
  getFriendRequests,
  getMyFriends,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  updateProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

// apply auth middleware to all routes
router.use(protectRoute);

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);
router.put("/profile", updateProfile);
router.delete("/account", deleteAccount);
router.delete("/friends/:id", removeFriend);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);
router.delete("/friend-request/:id", rejectFriendRequest);

router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

export default router;
