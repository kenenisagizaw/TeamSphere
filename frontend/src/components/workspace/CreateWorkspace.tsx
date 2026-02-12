import { useState } from "react";
import Button from "../common/Button";
import Input from "../common/Input";

interface CreateWorkspaceProps {
  onCreate: (name: string) => Promise<void>;
  loading?: boolean;
}

const CreateWorkspace = ({ onCreate, loading }: CreateWorkspaceProps) => {
  const [name, setName] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    await onCreate(name);
    setName("");
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <Input
        placeholder="New workspace"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Button type="submit" disabled={loading}>
        Add
      </Button>
    </form>
  );
};

export default CreateWorkspace;
