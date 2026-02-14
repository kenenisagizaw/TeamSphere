import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";

interface Message {
  id: number;
  content: string;
  userName: string;
}

interface Props {
  channelId: number;
}

const Chat: React.FC<Props> = ({ channelId }) => {
  const socket = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch existing messages and join channel room
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await api.get(`/channels/${channelId}/messages`);
      setMessages(data);
    };
    fetchMessages();

    if (socket) {
      socket.emit("joinChannel", channelId);
    }
  }, [channelId, socket]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receiveMessage", handleReceive);

    return () => {
      socket.off("receiveMessage", handleReceive);
    };
  }, [socket]);

  // Send a message
  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !user?.id) return;

    socket.emit("sendMessage", {
      channelId,
      content: newMessage,
      senderId: user.id,
    });
    setNewMessage("");
  };

  return (
    <div className="flex-1 flex flex-col border-l">
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {messages.length === 0 && (
          <div className="text-gray-400">No messages yet. Start the conversation!</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
            <span className="font-bold">{msg.userName}: </span>
            {msg.content}
          </div>
        ))}
      </div>

      <div className="p-2 border-t flex">
        <input
          className="flex-1 p-2 border rounded mr-2"
          type="text"
          value={newMessage}
          placeholder="Type a message..."
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
