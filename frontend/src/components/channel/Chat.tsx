import type { EmojiClickData } from "emoji-picker-react";
import EmojiPicker from "emoji-picker-react";
import {
  ArrowLeft,
  CheckCheck,
  Hash,
  Info,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Send,
  Smile,
  User
} from "lucide-react";
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
  userId?: number;
  fileUrl?: string;
}

interface Props {
  channel: Channel | null;
  onBack?: () => void;
}

const Chat: React.FC<Props> = ({ channel, onBack }) => {
  const { token, user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFilePreview, setPendingFilePreview] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [messageLoading, setMessageLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!channel || !token) return;

    setMessageLoading(true);
    setMessages([]);
    setTypingUsers(new Set());

    // Fetch messages
    api
      .get<Message[]>(`/channels/${channel.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMessages(res.data);
        setMessageLoading(false);
      })
      .catch(() => setMessageLoading(false));

    // Join socket room
    socket?.emit("joinChannel", channel.id);

    // Listen for new messages
    socket?.on("receiveMessage", (msg: Message) => {
      if (msg) setMessages((prev) => [...prev, msg]);
    });

    // Typing indicators
    socket?.on("userTyping", ({ userId, userName }: { userId: number; userName: string }) => {
      if (userId !== user?.id) setTypingUsers((prev) => new Set(prev).add(userName));
    });

    socket?.on("userStoppedTyping", ({ userId, userName }: { userId: number; userName: string }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userName);
        return newSet;
      });
    });

    return () => {
      socket?.off("receiveMessage");
      socket?.off("userTyping");
      socket?.off("userStoppedTyping");
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [channel, token, socket, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!channel || !user || (!input.trim())) return;

    socket?.emit("sendMessage", { 
      channelId: channel.id, 
      senderId: user.id, 
      content: input.trim(), 
      userName: user.name || user.email 
    });

    setInput("");
    setIsTyping(false);
    socket?.emit("stoppedTyping", { channelId: channel.id, userId: user.id });
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    if (!channel || !user) return;

    if (!isTyping && e.target.value) {
      setIsTyping(true);
      socket?.emit("typing", { channelId: channel.id, userId: user.id, userName: user.name || user.email });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket?.emit("stoppedTyping", { channelId: channel.id, userId: user.id });
      }
    }, 2000);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInput((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    if (file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      setPendingFilePreview(previewUrl);
    } else {
      setPendingFilePreview(null);
    }
  };

  const clearPendingFile = () => {
    if (pendingFilePreview) URL.revokeObjectURL(pendingFilePreview);
    setPendingFile(null);
    setPendingFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendFile = async () => {
    if (!pendingFile || !channel || !user) return;

    const formData = new FormData();
    formData.append("file", pendingFile);
    formData.append("channelId", String(channel.id));
    formData.append("senderId", String(user.id));

    try {
      setUploadingFile(true);
      const res = await api.post("/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      socket?.emit("sendMessage", {
        channelId: channel.id,
        senderId: user.id,
        content: "",
        fileUrl: res.data.fileUrl,
        userName: user.name || user.email,
      });
      clearPendingFile();
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingFile(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const resolveFileUrl = (fileUrl: string) =>
    fileUrl.startsWith("http") ? fileUrl : `http://localhost:5000${fileUrl}`;

  const isImageFile = (fileUrl: string) =>
    fileUrl.split("?")[0].match(/\.(jpeg|jpg|gif|png|webp)$/i);

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach(msg => {
      const date = new Date(msg.createdAt).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);
  const typingUsersList = Array.from(typingUsers);

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8">
          <div className="bg-white w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="text-blue-500" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No channel selected</h3>
          <p className="text-gray-500 max-w-sm">Choose a channel from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                <Hash size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  {channel.name}
                  <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
                    {messages.length} messages
                  </span>
                </h2>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <User size={12} />
                  Channel • Created for team collaboration
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Info size={18} className="text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
        {messageLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full max-w-md"></div>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mb-4">
              <MessageCircle className="text-blue-500" size={28} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No messages yet</h3>
            <p className="text-gray-500 text-sm max-w-sm mb-4">Be the first to send a message in #{channel.name}</p>
            <button onClick={() => inputRef.current?.focus()} className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1">
              Start a conversation
              <Send size={14} />
            </button>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date} className="mb-6">
              <div className="relative flex py-3 items-center mb-4">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {new Date(date).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {msgs.map((msg, index) => {
                const isCurrentUser = msg.userName === (user?.name || user?.email);
                const showAvatar = index === 0 || msgs[index - 1].userName !== msg.userName;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 mb-3 group hover:bg-white/50 p-2 rounded-lg transition-colors ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                  >
                    {showAvatar ? (
                      <div className={`flex-shrink-0 ${isCurrentUser ? 'ml-2' : 'mr-2'}`}>
                        <div className={`
                          w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                          ${isCurrentUser ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'}
                        `}>
                          {msg.userName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    ) : (
                      <div className="w-8"></div>
                    )}

                    <div className={`flex-1 max-w-[70%] ${isCurrentUser ? 'text-right' : ''}`}>
                      {showAvatar && (
                        <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                          <span className="font-semibold text-sm text-gray-800">{msg.userName}</span>
                        </div>
                      )}

                      <div className={`
                        inline-block px-4 py-2 rounded-2xl text-sm
                        ${isCurrentUser ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}
                      `}>
                        {msg.fileUrl ? (
                          isImageFile(msg.fileUrl) ? (
                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  resolveFileUrl(msg.fileUrl),
                                  "_blank",
                                  "noopener,noreferrer"
                                )
                              }
                              className="block"
                            >
                              <img
                                src={resolveFileUrl(msg.fileUrl)}
                                alt="uploaded"
                                className="max-w-xs rounded-lg"
                              />
                            </button>
                          ) : (
                            <a
                              href={resolveFileUrl(msg.fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              📎 Download file
                            </a>
                          )
                        ) : (
                          msg.content
                        )}
                      </div>

                      <div className={`text-[10px] opacity-70 mt-1 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        {formatTime(msg.createdAt)}
                      </div>

                      {isCurrentUser && (
                        <div className="flex justify-end mt-1">
                          <CheckCheck size={14} className="text-blue-500" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {typingUsersList.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 italic mt-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            {typingUsersList.join(', ')} {typingUsersList.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 relative">
        {showEmojiPicker && (
          <div className="absolute bottom-16 right-6 z-50 shadow-lg">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

        {pendingFile && (
          <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            {pendingFilePreview ? (
              <img
                src={pendingFilePreview}
                alt={pendingFile.name}
                className="w-16 h-16 rounded-lg object-cover border"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-white border flex items-center justify-center text-xs text-gray-500">
                FILE
              </div>
            )}
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800 truncate">
                {pendingFile.name}
              </div>
              <div className="text-xs text-gray-500">
                {(pendingFile.size / 1024).toFixed(1)} KB
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearPendingFile}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={handleSendFile}
                disabled={uploadingFile}
                className={
                  uploadingFile
                    ? "px-3 py-2 rounded-lg bg-blue-300 text-white text-sm"
                    : "px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                }
              >
                {uploadingFile ? "Sending..." : "Send file"}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              className="w-full px-4 py-3 pr-24 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none outline-none transition-all bg-gray-50 hover:bg-white focus:bg-white"
              rows={1}
              placeholder={`Message #${channel?.name}`}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />

            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Attach file">
                <Paperclip size={18} className="text-gray-500" />
              </button>

              <button type="button" onClick={() => setShowEmojiPicker((prev) => !prev)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Add emoji">
                <Smile size={18} className="text-gray-500" />
              </button>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`
              p-3 rounded-xl transition-all flex items-center justify-center
              ${input.trim()
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
