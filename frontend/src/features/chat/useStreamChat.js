import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import { getStreamToken } from "../../lib/api";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

let streamConnectionPromise = null;
let streamConnectionUserId = null;

async function ensureConnected(client, user, token) {
  const userId = String(user._id);

  if (streamConnectionPromise) {
    if (streamConnectionUserId === userId) {
      await streamConnectionPromise;
      return;
    }
    await streamConnectionPromise.catch(() => {});
  }

  if (client.userID === userId) {
    return;
  }
  if (client.userID) await client.disconnectUser();

  streamConnectionUserId = userId;
  const pendingConnection = client.connectUser(
    {
      id: userId,
      name: user.fullName,
      image: user.profilePic || "",
    },
    token,
  );
  streamConnectionPromise = pendingConnection;

  try {
    await pendingConnection;
  } catch (error) {
    if (client.userID === userId) {
      try {
        await client.disconnectUser();
      } catch {
        // Preserve the original connection failure for the retry UI.
      }
    }
    throw error;
  } finally {
    if (streamConnectionPromise === pendingConnection) {
      streamConnectionPromise = null;
      streamConnectionUserId = null;
    }
  }
}

export async function disconnectStreamChat() {
  if (!STREAM_API_KEY) return;
  const client = StreamChat.getInstance(STREAM_API_KEY);
  if (streamConnectionPromise) await streamConnectionPromise.catch(() => {});
  if (client.userID) await client.disconnectUser();
  streamConnectionPromise = null;
  streamConnectionUserId = null;
}

export default function useStreamChat(user, targetUserId) {
  const userId = user?._id ? String(user._id) : "";
  const {
    data: tokenData,
    isLoading: isTokenLoading,
    error: tokenError,
    refetch: refetchToken,
  } = useQuery({
    queryKey: ["streamToken", userId],
    queryFn: getStreamToken,
    enabled: Boolean(userId),
    retry: 1,
  });

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setChatClient(null);
    setChannel(null);
    setError("");

    if (!userId || !targetUserId) {
      setIsLoading(false);
      return () => { cancelled = true; };
    }

    if (isTokenLoading) {
      setIsLoading(true);
      return () => { cancelled = true; };
    }

    if (tokenError || !tokenData?.token) {
      setError(tokenError?.response?.data?.message || "Could not get a chat connection token.");
      setIsLoading(false);
      return () => { cancelled = true; };
    }

    if (!STREAM_API_KEY) {
      setError("Chat is not configured. Add VITE_STREAM_API_KEY to the frontend environment.");
      setIsLoading(false);
      return () => { cancelled = true; };
    }

    setIsLoading(true);

    const initialize = async () => {
      try {
        const client = StreamChat.getInstance(STREAM_API_KEY);
        await ensureConnected(client, user, tokenData.token);
        if (cancelled) return;

        const targetId = String(targetUserId);
        const members = [userId, targetId].sort();
        const stableChannelId = members.join("-");
        const directChannel = client.channel("messaging", stableChannelId, {
          members,
          created_by_id: userId,
        });

        await directChannel.watch();
        if (cancelled) return;

        setChatClient(client);
        setChannel(directChannel);
        setIsLoading(false);
      } catch (chatError) {
        console.error("Error initializing Stream chat:", chatError);
        if (!cancelled) {
          setError(chatError?.message || "Could not connect to chat. Please try again.");
          setIsLoading(false);
        }
      }
    };

    initialize();
    return () => { cancelled = true; };
  }, [user, userId, targetUserId, tokenData?.token, tokenError, isTokenLoading, retryCount]);

  const retry = async () => {
    setRetryCount((count) => count + 1);
    if (tokenError || !tokenData?.token) await refetchToken();
  };

  return { chatClient, channel, isLoading, error, retry };
}
