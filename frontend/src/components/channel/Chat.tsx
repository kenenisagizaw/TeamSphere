import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import api from "../../api/axios";

interface Message {
  id: number;
  content: string;
  sender: { name: string };
  createdAt: string;
}

interface ChatProps {
  channelId: number;
  socket: Socket | null;
}

const Chat: React.FC<ChatProps> = ({ channelId, socket }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");

  // Fetch channel messages from backend (optional if backend stores)
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await api.get(`/channels/${channelId}/messages`);
        setMessages(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
  }, [channelId]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;

    socket.emit("joinChannel", channelId);

    socket.on("receiveMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [channelId, socket]);

  const sendMessage = () => {
    if (!message.trim() || !socket) return;
    socket.emit("sendMessage", { channelId, content: message });
    setMessage("");
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <span className="font-bold">{msg.sender.name}: </span>
            <span>{msg.content}</span>
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleEnter}
          className="flex-1 border rounded p-2 mr-2"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
