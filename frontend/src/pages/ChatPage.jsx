import { useParams } from "react-router";
import { Channel, ChannelHeader, Chat, MessageInput, MessageList, Thread, Window } from "stream-chat-react";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";
import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import useStreamChat from "../features/chat/useStreamChat";
import { useLanguage } from "../features/language/useLanguage";

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const { authUser } = useAuthUser();
  const { t } = useLanguage();
  const { chatClient, channel, isLoading, error, retry } = useStreamChat(authUser, targetUserId);

  const handleVideoCall = async () => {
    if (!channel) return;

    try {
      const callUrl = `${window.location.origin}/call/${channel.id}`;
      await channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });
      toast.success("Video call link sent successfully!");
    } catch (sendError) {
      toast.error(sendError?.message || "Could not send the video call link.");
    }
  };

  if (isLoading) return <ChatLoader />;

  if (error || !chatClient || !channel) {
    return (
      <div className="chat-error-screen">
        <div className="chat-error-card">
          <div className="chat-error-icon">!</div>
          <h1>{t("chat.errorTitle")}</h1>
          <p>{error || t("chat.errorDefault")}</p>
          <button type="button" className="btn btn-primary" onClick={retry}>{t("chat.retry")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page-shell">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="chat-page-window">
            <CallButton handleVideoCall={handleVideoCall} />
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};

export default ChatPage;
