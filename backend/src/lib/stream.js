import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("Stream API key or secret is missing. Check STREAM_API_KEY and STREAM_API_SECRET in backend/.env");
}

const streamClient = apiKey && apiSecret ? StreamChat.getInstance(apiKey, apiSecret) : null;

export const upsertStreamUser = async (userData) => {
  try {
    if (!streamClient) {
      throw new Error("Stream client is not configured. Missing STREAM_API_KEY or STREAM_API_SECRET.");
    }

    await streamClient.upsertUsers([userData]);
    return userData;
  } catch (error) {
    console.error("Error upserting Stream user:", error);
    throw error;
  }
};

export const generateStreamToken = (userId) => {
  try {
    if (!streamClient) {
      throw new Error("Stream client is not configured. Missing STREAM_API_KEY or STREAM_API_SECRET.");
    }

    const userIdStr = userId.toString();
    return streamClient.createToken(userIdStr);
  } catch (error) {
    console.error("Error generating Stream token:", error);
    throw error;
  }
};

export const deleteStreamUser = async (userId) => {
  if (!streamClient) return;
  await streamClient.deleteUsers([userId.toString()], {
    user: "hard",
    messages: "hard",
    conversations: "hard",
  });
};
