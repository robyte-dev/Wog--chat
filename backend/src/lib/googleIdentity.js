import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client();

export async function verifyGoogleIdToken(idToken, expectedNonce) {
  const audience = process.env.GOOGLE_CLIENT_ID;
  if (!audience) {
    const error = new Error("Google sign-in is not configured on the server.");
    error.code = "GOOGLE_AUTH_NOT_CONFIGURED";
    throw error;
  }

  const ticket = await googleClient.verifyIdToken({ idToken, audience });
  const claims = ticket.getPayload();

  if (!claims?.sub || !claims.email || claims.email_verified !== true || claims.nonce !== expectedNonce) {
    const error = new Error("Google did not return a verified account.");
    error.code = "GOOGLE_IDENTITY_INVALID";
    throw error;
  }

  return {
    googleId: claims.sub,
    email: claims.email.trim().toLowerCase(),
    fullName: claims.name?.trim() || claims.email.split("@")[0],
    profilePic: claims.picture || "",
  };
}
