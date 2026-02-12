import { useState } from "react";
import type { Channel } from "../../api";
import Button from "../common/Button";
import Input from "../common/Input";

interface ChannelListProps {
  channels: Channel[];
  onCreate?: (name: string) => Promise<void>;
  loading?: boolean;
  selectedChannelId?: number | null;
  onSelectChannel?: (channel: Channel) => void;
}

const ChannelList = ({
  channels,
  onCreate,
  loading,
  selectedChannelId,
  onSelectChannel,
}: ChannelListProps) => {
  const [name, setName] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onCreate || !name.trim()) return;
    await onCreate(name);
    setName("");
  };

  return (
    <>
      <div className="list">
        {channels.length === 0 && <p className="muted">No channels yet.</p>}
        {channels.map((channel) => (
          <button
            key={channel.id}
            type="button"
            className={
              channel.id === selectedChannelId
                ? "list-item active"
                : "list-item"
            }
            onClick={() => onSelectChannel?.(channel)}
          >
            <span># {channel.name}</span>
          </button>
        ))}
      </div>
      {onCreate && (
        <form className="inline-form" onSubmit={handleSubmit}>
          <Input
            placeholder="New channel"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button type="submit" disabled={loading}>
            Add
          </Button>
        </form>
      )}
    </>
  );
};

export default ChannelList;
