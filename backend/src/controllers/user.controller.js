import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import { syncStreamUser } from "../lib/authSession.js";
import { deleteStreamUser } from "../lib/stream.js";
import PasswordResetCode from "../models/PasswordResetCode.js";
import AuthSession from "../models/AuthSession.js";
import TrustedDevice from "../models/TrustedDevice.js";

const profileFields = ["fullName", "bio", "profilePic", "nativeLanguage", "location"];

export async function updateProfile(req, res) {
  try {
    const updates = Object.fromEntries(profileFields
      .filter((field) => typeof req.body?.[field] === "string")
      .map((field) => [field, req.body[field].trim()]));
    if (!updates.fullName || updates.fullName.length > 80) {
      return res.status(400).json({ message: "Please enter a name up to 80 characters." });
    }
    if ((updates.bio || "").length > 500 || (updates.location || "").length > 120) {
      return res.status(400).json({ message: "Bio or location is too long." });
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ message: "Profile not found." });
    await syncStreamUser(user);
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Profile update failed:", error.message);
    return res.status(500).json({ message: "Could not update your profile." });
  }
}

export async function deleteAccount(req, res) {
  const userId = req.user._id;
  try {
    // Remove the Stream identity and its chat data before deleting the local account.
    await deleteStreamUser(userId);
    await Promise.all([
      User.updateMany({ friends: userId }, { $pull: { friends: userId } }),
      FriendRequest.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] }),
      PasswordResetCode.deleteMany({ user: userId }),
      AuthSession.deleteMany({ user: userId }),
      TrustedDevice.deleteMany({ user: userId }),
    ]);
    await User.findByIdAndDelete(userId);
    res.clearCookie("jwt");
    res.clearCookie("wog_device", { httpOnly: true, secure: process.env.COOKIE_SECURE === "true" || (process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production"), sameSite: "strict", path: "/" });
    return res.status(200).json({ success: true, message: "Your account and associated chat data were deleted." });
  } catch (error) {
    console.error("Account deletion failed:", error.message);
    return res.status(500).json({ message: "Account deletion could not be completed. Please try again." });
  }
}

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, //exclude current user
        { _id: { $nin: currentUser.friends } }, // exclude current user's friends
        { isOnboarded: true },
      ],
    }).select("fullName profilePic nativeLanguage location bio");
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error in getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic nativeLanguage");

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    // prevent sending req to yourself
    if (myId === recipientId) {
      return res.status(400).json({ message: "You can't send friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // check if user is already friends
    if (recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    // check if a req already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "A friend request already exists between you and this user" });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each user to the other's friends array
    // $addToSet: adds elements to an array only if they do not already exist.
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function rejectFriendRequest(req, res) {
  try {
    const request = await FriendRequest.findOneAndUpdate({
      _id: req.params.id,
      recipient: req.user.id,
      status: "pending",
    }, { $set: { status: "rejected" } }, { new: true });
    if (!request) return res.status(404).json({ message: "Pending friend request not found." });
    return res.status(200).json({ success: true, message: "Friend request declined." });
  } catch (error) {
    console.error("Friend request rejection failed:", error.message);
    return res.status(500).json({ message: "Could not decline the friend request." });
  }
}

export async function removeFriend(req, res) {
  try {
    const friendId = req.params.id;
    if (friendId === req.user.id) return res.status(400).json({ message: "You cannot remove yourself." });
    const friend = await User.findById(friendId).select("_id");
    if (!friend) return res.status(404).json({ message: "Friend not found." });

    await Promise.all([
      User.updateOne({ _id: req.user.id }, { $pull: { friends: friend._id } }),
      User.updateOne({ _id: friend._id }, { $pull: { friends: req.user._id } }),
      FriendRequest.deleteMany({
        status: "accepted",
        $or: [
          { sender: req.user._id, recipient: friend._id },
          { sender: friend._id, recipient: req.user._id },
        ],
      }),
    ]);
    return res.status(200).json({ success: true, message: "Friend removed." });
  } catch (error) {
    console.error("Friend removal failed:", error.message);
    return res.status(500).json({ message: "Could not remove this friend." });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage bio location");

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    const declinedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "rejected",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({ incomingReqs, acceptedReqs, declinedReqs });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic nativeLanguage");

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
