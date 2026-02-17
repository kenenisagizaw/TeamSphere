import React, { useEffect, useState } from "react";
import type { Channel } from "../../api";
import { createChannel, getChannels } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import {
  Hash,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Sparkles
} from "lucide-react";

interface Props {
  workspaceId: number;
  selectedChannelId: number | null;
  onSelectChannel: (channel: Channel) => void;
}

const ChannelList: React.FC<Props> = ({
  workspaceId,
  selectedChannelId,
  onSelectChannel,
}) => {
  const { token } = useAuth();
  const socket = useSocket();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [notification, setNotification] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  // Fetch channels
  useEffect(() => {
    if (!token) return;

    const fetchChannels = async () => {
      const data = await getChannels(token, workspaceId);

      // Sort alphabetically
      const sorted = data.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setChannels(sorted);

      // Auto select first channel if none selected
      if (sorted.length > 0 && !selectedChannelId) {
        onSelectChannel(sorted[0]);
      }
    };

    fetchChannels();
  }, [workspaceId, token]);

  // Listen for real-time channel creation
  useEffect(() => {
    if (!socket) return;

    const handleChannelCreated = (channel: Channel) => {
      if (channel.workspaceId !== workspaceId) return;

      setChannels((prev) => {
        // Prevent duplicates
        if (prev.some((c) => c.id === channel.id)) {
          return prev;
        }

        const updated = [...prev, channel].sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        return updated;
      });

      setNotification({
        type: "success",
        message: `New channel #${channel.name} created`,
      });

      setTimeout(() => setNotification(null), 3000);
    };

    socket.on("channelCreated", handleChannelCreated);

    return () => {
      socket.off("channelCreated", handleChannelCreated);
    };
  }, [socket, workspaceId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };

    if (modalOpen) {
      document.addEventListener("keydown", handleEscape);
      return () =>
        document.removeEventListener("keydown", handleEscape);
    }
  }, [modalOpen]);

  //  Create channel (NO SOCKET EMIT)
  const handleCreateChannel = async () => {
    if (!channelName.trim() || !token) return;

    setLoading(true);

    try {
      await createChannel(token, {
        name: channelName,
        workspaceId,
      });

      // Backend will emit event automatically
      setChannelName("");
      setModalOpen(false);

      setNotification({
        type: "success",
        message: `Channel #${channelName} created`,
      });

      setTimeout(() => setNotification(null), 3000);

    } catch (err: any) {
      setNotification({
        type: "error",
        message:
          err.response?.data?.message ||
          "Failed to create channel",
      });
    } finally {
      setLoading(false);
    }
  };

  const getChannelInitial = (name: string) =>
    name.charAt(0).toUpperCase();

  return (
    <>
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-500"
              : "bg-red-500"
          } text-white`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span className="text-sm">
            {notification.message}
          </span>
        </div>
      )}

      <div className="bg-white w-72 flex flex-col h-full border-r border-gray-200 shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                <MessageSquare size={16} />
                Channels
                <span className="bg-gray-200 px-1.5 py-0.5 rounded-full text-xs">
                  {channels.length}
                </span>
              </h2>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              className="p-1 hover:bg-gray-200 rounded-lg"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Channel List */}
        {isExpanded && (
          <div className="flex-1 overflow-y-auto py-2 px-3">
            {channels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No channels yet
              </div>
            ) : (
              <ul className="space-y-1">
                {channels.map((channel) => (
                  <li
                    key={channel.id}
                    onClick={() => onSelectChannel(channel)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                      selectedChannelId === channel.id
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-md bg-gray-200 flex items-center justify-center text-xs font-bold">
                      {getChannelInitial(channel.name)}
                    </div>
                    <span className="flex-1 truncate text-sm">
                      {channel.name}
                    </span>
                    <Hash size={14} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Create Channel Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                Create Channel
              </h3>

              <input
                type="text"
                className="w-full border p-3 rounded-lg mb-4"
                placeholder="channel-name"
                value={channelName}
                onChange={(e) =>
                  setChannelName(
                    e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                  )
                }
              />

              <div className="flex gap-3">
                <button
                  onClick={handleCreateChannel}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Create"
                  )}
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChannelList;
