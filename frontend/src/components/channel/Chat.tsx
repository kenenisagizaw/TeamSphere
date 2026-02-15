import React, { useEffect, useRef, useState } from "react";
import type { Channel } from "../../api";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";

interface Message {
  id: number;
  content: string;
  userName: string;
  createdAt: string;
}

interface Props {
  channel: Channel | null;
}

const Chat: React.FC<Props> = ({ channel }) => {
  const { token, user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!channel || !token) return;

    // Fetch existing messages
    api
      .get<Message[]>(`/channels/${channel.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data));

    // Join channel room
    socket?.emit("joinChannel", channel.id);

    // Listen for new messages
    socket?.on("receiveMessage", (msg: Message) => {
      if (msg) setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket?.off("receiveMessage");
    };
  }, [channel, token, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !channel || !user) return;
    socket?.emit("sendMessage", { channelId: channel.id, content: input, senderId: user.id });
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!channel) return <div className="flex-1 p-4">Select a channel to start chatting.</div>;

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id}>
            <span className="font-semibold">{msg.userName}: </span>
            <span>{msg.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t border-gray-300">
        <textarea
          className="w-full border p-2 rounded resize-none"
          rows={2}
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button
          onClick={handleSend}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
