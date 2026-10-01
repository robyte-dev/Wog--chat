import User from "../models/User.js";
import { createAuthSession, syncStreamUser } from "../lib/authSession.js";
import { beginVerifiedLogin, endCurrentSession } from "../lib/deviceAuth.js";

export async function signup(req, res) {
  const { password, fullName } = req.body;
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    // universal regex expression for email form
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists, please use a diffrent one" });
    }

    const idx = Math.floor(Math.random() * 100) + 1; // generate a num between 1-100
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,
    });

    await syncStreamUser(newUser);
    return await createAuthSession(req, res, newUser, 201, true);
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) return res.status(401).json({ message: "Invalid email or password" });

    return await beginVerifiedLogin(req, res, user);
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(error.status || (error.code === "EMAIL_NOT_CONFIGURED" ? 503 : 500)).json({
      message: error.code === "EMAIL_NOT_CONFIGURED" ? "Email verification is not configured yet. Please contact support." : error.message || "Internal Server Error",
    });
  }
}

export async function logout(req, res) {
  return endCurrentSession(req, res);
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const { fullName, bio, nativeLanguage, location } = req.body;

    if (!fullName || !bio || !nativeLanguage || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName: fullName.trim(),
        bio: bio.trim(),
        nativeLanguage,
        location: location.trim(),
        ...(typeof req.body.profilePic === "string" ? { profilePic: req.body.profilePic } : {}),
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(`Stream user updated after onboarding for ${updatedUser.fullName}`);
    } catch (streamError) {
      console.log("Error updating Stream user during onboarding:", streamError.message);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
