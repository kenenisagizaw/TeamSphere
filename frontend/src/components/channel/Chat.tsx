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
  X,
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
  fileName?: string;
  fileType?: string;
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

  const [modalImage, setModalImage] = useState<string | null>(null); // image modal

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ================================
     FETCH + SOCKET
  ================================= */
  useEffect(() => {
    if (!channel || !token) return;

    setMessageLoading(true);
    setMessages([]);
    setTypingUsers(new Set());

    api
      .get<Message[]>(`/channels/${channel.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMessages(res.data);
        setMessageLoading(false);
      })
      .catch(() => setMessageLoading(false));

    socket?.emit("joinChannel", channel.id);

    socket?.on("receiveMessage", (msg: Message) => {
      if (msg) setMessages((prev) => [...prev, msg]);
    });

    socket?.on("userTyping", ({ userId, userName }: any) => {
      if (userId !== user?.id) setTypingUsers((prev) => new Set(prev).add(userName));
    });

    socket?.on("userStoppedTyping", ({ userName }: any) => {
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

  /* ================================
     HELPERS
  ================================= */
  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const resolveFileUrl = (fileUrl: string) =>
    fileUrl.startsWith("http") ? fileUrl : `http://localhost:5000${fileUrl}`;

  const isImageFile = (fileUrl: string | undefined, fileType?: string) =>
    !!fileUrl && (fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || fileType?.startsWith("image/"));

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach((msg) => {
      const date = new Date(msg.createdAt).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);
  const typingUsersList = Array.from(typingUsers);

  /* ================================
     FILE HANDLERS
  ================================= */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    if (file.type.startsWith("image/")) {
      setPendingFilePreview(URL.createObjectURL(file));
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
      const res = await api.post("/uploads", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const newMsg: Message = {
        id: Date.now(),
        userId: user.id,
        userName: user.name || user.email,
        content: "",
        fileUrl: res.data.fileUrl,
        fileName: pendingFile.name,
        fileType: pendingFile.type,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMsg]);
      socket?.emit("sendMessage", newMsg);
      clearPendingFile();
    } finally {
      setUploadingFile(false);
    }
  };

  /* ================================
     TYPING + SEND
  ================================= */
  const handleSend = () => {
    if (!channel || !user) return;

    if (pendingFile) {
      handleSendFile();
      return;
    }

    if (!input.trim()) return;

    const newMsg: Message = {
      id: Date.now(),
      userId: user.id,
      userName: user.name || user.email,
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    socket?.emit("sendMessage", newMsg);

    setInput("");
    setIsTyping(false);
    socket?.emit("stoppedTyping", { channelId: channel.id, userId: user.id });
    inputRef.current?.focus();
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ================================
     UI
  ================================= */
 if (!channel) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <MessageCircle size={36} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 text-sm font-medium">
          Select a channel to start chatting
        </p>
      </div>
    </div>
  );
}

  return (
    <div className="flex-1 flex flex-col h-full bg-white">

      {/* HEADER */}
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
            <Hash size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{channel.name}</h2>
            <p className="text-xs text-gray-500">{messages.length} messages</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Info size={18} className="text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50">
        {Object.entries(messageGroups).map(([date, msgs]) => (
          <div key={date} className="mb-6">
            <div className="text-center text-xs text-gray-400 mb-4">
              {new Date(date).toLocaleDateString()}
            </div>

            {msgs.map((msg) => {
              const isCurrentUser = msg.userName === (user?.name || user?.email);
              return (
                <div key={msg.id} className={`flex mb-4 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[70%]">
                    {!isCurrentUser && <p className="text-xs text-gray-500 mb-1">{msg.userName}</p>}
                    <div className={`px-4 py-2 text-sm rounded-2xl ${isCurrentUser ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"}`}>
                      {msg.fileUrl ? (
                        isImageFile(msg.fileUrl, msg.fileType) ? (
                          <img
                            src={resolveFileUrl(msg.fileUrl)}
                            alt={msg.fileName ?? "uploaded"}
                            className="rounded-lg max-w-xs cursor-pointer"
                            onClick={() => msg.fileUrl && setModalImage(resolveFileUrl(msg.fileUrl))}
                          />
                        ) : (
                          <a href={resolveFileUrl(msg.fileUrl)} target="_blank" rel="noopener noreferrer" className="underline">
                            📎 {msg.fileName ?? "Download file"}
                          </a>
                        )
                      ) : (
                        msg.content
                      )}
                    </div>
                    <p className={`text-[10px] text-gray-400 mt-1 ${isCurrentUser ? "text-right" : "text-left"}`}>
                      {formatTime(msg.createdAt)}
                      {isCurrentUser && <CheckCheck size={12} className="inline ml-1" />}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {typingUsersList.length > 0 && <div className="text-sm text-gray-500 italic">{typingUsersList.join(", ")} typing...</div>}

        <div ref={bottomRef} />
      </div>

      {/* FILE PREVIEW + INPUT */}
      <div className="border-t px-6 py-4 relative">
        {showEmojiPicker && (
          <div className="absolute bottom-16 right-6 z-50">
            <EmojiPicker onEmojiClick={(emojiData: EmojiClickData) => setInput((prev) => prev + emojiData.emoji)} />
          </div>
        )}

        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

        {pendingFile && (
          <div className="mb-3 bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
            {pendingFilePreview ? (
              <img src={pendingFilePreview} alt={pendingFile.name} className="w-16 h-16 rounded-lg object-cover border" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-white border flex items-center justify-center text-xs text-gray-500">FILE</div>
            )}
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-gray-800 truncate">{pendingFile.name}</p>
              <p className="text-xs text-gray-500">{(pendingFile.size / 1024).toFixed(1)} KB</p>
            </div>
            <div className="flex gap-2">
              <button onClick={clearPendingFile} className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-100">Remove</button>
              <button onClick={handleSendFile} disabled={uploadingFile} className={`px-3 py-2 text-sm rounded-lg text-white ${uploadingFile ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}>{uploadingFile ? "Sending..." : "Send file"}</button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={`Message #${channel.name}`}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
            <div className="absolute right-2 bottom-2 flex gap-1">
              <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-200 rounded-lg"><Paperclip size={18} /></button>
              <button onClick={() => setShowEmojiPicker(prev => !prev)} className="p-2 hover:bg-gray-200 rounded-lg"><Smile size={18} /></button>
            </div>
          </div>

          <button onClick={handleSend} disabled={!input.trim() && !pendingFile} className={`p-3 rounded-xl transition ${input.trim() || pendingFile ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}><Send size={18} /></button>
        </div>
      </div>

      {/* IMAGE MODAL */}
      {modalImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="relative">
            <img src={modalImage} alt="preview" className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg" />
            <button onClick={() => setModalImage(null)} className="absolute top-2 right-2 p-2 bg-white rounded-full hover:bg-gray-200"><X size={18} /></button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Chat;