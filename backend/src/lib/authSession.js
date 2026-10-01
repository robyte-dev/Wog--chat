import { upsertStreamUser } from "./stream.js";
export { createAuthSession } from "./deviceAuth.js";

export async function syncStreamUser(user) {
  try {
    await upsertStreamUser({
      id: user._id.toString(),
      name: user.fullName,
      image: user.profilePic || "",
    });
  } catch (error) {
    // Stream profile sync should not prevent a user from signing in.
    console.error("Could not sync the app user with Stream:", error.message);
  }
}
