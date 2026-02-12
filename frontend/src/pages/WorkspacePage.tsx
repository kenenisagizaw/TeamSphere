import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import type { Channel } from "../api";
import { createChannel, getChannels } from "../api";
import { SocketContext } from "../context/SocketContext";
import ChannelList from "../components/channel/ChannelList";
import Chat from "../components/channel/Chat";
import { useAuth } from "../context/AuthContext";

const WorkspacePage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { token } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(
    null
  );
  const { socket } = useContext(SocketContext);

  const numericWorkspaceId = workspaceId ? Number(workspaceId) : null;

  useEffect(() => {
    const fetchChannels = async () => {
      if (!token || !numericWorkspaceId) return;
      try {
        const data = await getChannels(token, numericWorkspaceId);
        setChannels(data);
        if (data.length > 0) setSelectedChannelId(data[0].id);
      } catch (err) {
        console.error(err);
      }
    };

    fetchChannels();
  }, [numericWorkspaceId, token]);

  const handleCreateChannel = async (name: string) => {
    if (!token || !numericWorkspaceId) return;
    try {
      await createChannel(token, {
        name,
        workspaceId: numericWorkspaceId,
      });
      const data = await getChannels(token, numericWorkspaceId);
      setChannels(data);
      if (data.length > 0) setSelectedChannelId(data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard">
      <section className="panel">
        <div className="panel-header">
          <h2>Channels</h2>
          <span className="badge">{channels.length}</span>
        </div>
        <ChannelList
          channels={channels}
          selectedChannelId={selectedChannelId}
          onSelectChannel={(channel) => setSelectedChannelId(channel.id)}
          onCreate={handleCreateChannel}
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Chat</h2>
        </div>
        {selectedChannelId ? (
          <Chat channelId={selectedChannelId} socket={socket} />
        ) : (
          <p className="muted">Select a channel to start chatting.</p>
        )}
      </section>
    </div>
  );
};

export default WorkspacePage;
