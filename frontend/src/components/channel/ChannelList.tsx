import React from "react";
import type { Channel } from "../../api";

interface Props {
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelect: (channel: Channel) => void;
  workspaceId?: string;
}

const ChannelList: React.FC<Props> = ({ channels, selectedChannel, onSelect }) => {
  return (
    <div className="w-64 bg-gray-100 border-r p-2 overflow-y-auto">
      <h2 className="font-bold mb-2">Channels</h2>
      {channels.map((channel) => (
        <div
          key={channel.id}
          onClick={() => onSelect(channel)}
          className={`p-2 rounded cursor-pointer ${
            selectedChannel?.id === channel.id ? "bg-blue-500 text-white" : "hover:bg-gray-200"
          }`}
        >
          # {channel.name}
        </div>
      ))}
    </div>
  );
};

export default ChannelList;
