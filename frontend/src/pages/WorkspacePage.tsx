import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Channel } from "../api";
import { getChannels } from "../api";
import ChannelList from "../components/channel/ChannelList";
import Chat from "../components/channel/Chat";
import { useAuth } from "../context/AuthContext";

const WorkspacePage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const { token } = useAuth();

  // Optional: auto-select first channel
  useEffect(() => {
    if (!token || !workspaceId) return;
    getChannels(token, Number(workspaceId)).then((channels) => {
      if (channels.length && !selectedChannel) setSelectedChannel(channels[0]);
    });
  }, [workspaceId, token, selectedChannel]);

  return (
    <div className="flex h-screen">
      <ChannelList
        workspaceId={Number(workspaceId)}
        selectedChannelId={selectedChannel?.id || null}
        onSelectChannel={setSelectedChannel}
      />
      <Chat channel={selectedChannel} />
    </div>
  );
};

export default WorkspacePage;
