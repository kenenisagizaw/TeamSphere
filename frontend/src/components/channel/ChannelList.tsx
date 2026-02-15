import React, { useEffect, useState } from "react";
import type { Channel } from "../../api";
import { createChannel, getChannels } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";

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

  // Fetch channels
  useEffect(() => {
    if (!token) return;

    getChannels(token, workspaceId).then(setChannels);

    // Listen for real-time channel creation
    socket?.on("channelCreated", (channel: Channel) => {
      if (channel.workspaceId === workspaceId) {
        setChannels((prev) => [...prev, channel]);
      }
    });

    return () => {
      socket?.off("channelCreated");
    };
  }, [workspaceId, token, socket]);

  // Create channel
  const handleCreateChannel = async () => {
    if (!channelName.trim() || !token) return;

    setLoading(true);
    try {
      const newChannel = await createChannel(token, {
        name: channelName,
        workspaceId,
      });

      // Optimistic update
      setChannels((prev) => [...prev, newChannel]);
      onSelectChannel(newChannel);

      setChannelName("");
      setModalOpen(false);

      // Emit to others
      socket?.emit("channelCreated", newChannel);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 w-64 p-4 border-r flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Channels</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="text-blue-500 hover:text-blue-700 text-sm"
        >
          + Add
        </button>
      </div>

      <ul className="space-y-2 flex-1 overflow-y-auto">
        {channels.map((channel) => (
          <li
            key={channel.id}
            onClick={() => onSelectChannel(channel)}
            className={`cursor-pointer p-2 rounded transition ${
              selectedChannelId === channel.id
                ? "bg-blue-500 text-white"
                : "hover:bg-gray-200"
            }`}
          >
            #{channel.name}
          </li>
        ))}
      </ul>

      {/* Create Channel Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-80 shadow">
            <h3 className="font-bold mb-3">Create Channel</h3>

            <input
              type="text"
              className="border w-full p-2 rounded mb-4"
              placeholder="Channel name"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCreateChannel}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-1 rounded border hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelList;
