import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import ChannelList from "../components/channel/ChannelList";
import Chat from "../components/channel/Chat";
import { useSocket } from "../context/SocketContext";
interface Channel {
  id: number;
  name: string;
}

const WorkspacePage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const socket = useSocket();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // Fetch channels for this workspace
  useEffect(() => {
    const fetchChannels = async () => {
      if (!workspaceId) return;
      try {
        const { data } = await api.get(`/workspaces/${workspaceId}/channels`);
        setChannels(data);

        // Auto-select first channel if none selected
        if (data.length > 0 && !selectedChannel) {
          setSelectedChannel(data[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchChannels();
  }, [workspaceId]);

  // Listen for new channels created in this workspace
  useEffect(() => {
    if (!socket || !workspaceId) return;

    socket.on("channelCreated", (channel: Channel) => {
      setChannels((prev) => [...prev, channel]);
      // Optionally auto-select newly created channel
      setSelectedChannel(channel);
    });

    return () => {
      socket.off("channelCreated");
    };
  }, [socket, workspaceId]);

  if (!workspaceId) return <div>Workspace not found</div>;

  return (
    <div className="flex h-screen">
      <ChannelList
        channels={channels}
        selectedChannel={selectedChannel}
        onSelect={setSelectedChannel}
        workspaceId={workspaceId}
      />
      {selectedChannel ? (
        <Chat channelId={selectedChannel.id} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Select a channel to start chatting
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;
