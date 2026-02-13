import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createWorkspace, getWorkspaces, joinWorkspace } from "../api";
import CreateWorkspace from "../components/workspace/CreateWorkspace";
import { useAuth } from "../context/AuthContext";

interface Workspace {
  id: number;
  name: string;
  isMember: boolean;
}

const Dashboard = () => {
  const { token } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!token) return;
      try {
        const data = await getWorkspaces(token);
        setWorkspaces(data);
        setError(null);
      } catch (err) {
        setError("Failed to load workspaces.");
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, [token]);

  const handleJoin = async (workspaceId: number) => {
    try {
      if (!token) return;
      await joinWorkspace(token, workspaceId);
      setWorkspaces(prev =>
        prev.map(ws =>
          ws.id === workspaceId ? { ...ws, isMember: true } : ws
        )
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to join workspace");
    }
  };

  const handleCreateWorkspace = async (name: string) => {
    if (!token) return;
    try {
      const created = await createWorkspace(token, { name });
      setWorkspaces((prev) => [
        { id: created.id, name: created.name, isMember: true },
        ...prev,
      ]);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create workspace");
    }
  };

  if (loading) return <div className="p-4">Loading workspaces...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Your Workspaces</h1>
      {error && <div className="alert">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className="border p-4 rounded-lg hover:shadow-lg transition flex justify-between items-center"
          >
            <h2 className="text-lg font-semibold">{ws.name}</h2>
            {ws.isMember ? (
              <button
                onClick={() => navigate(`/workspaces/${ws.id}`)}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
              >
                Enter
              </button>
            ) : (
              <button
                onClick={() => handleJoin(ws.id)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
              >
                Join
              </button>
            )}
          </div>
        ))}
      </div>
      <CreateWorkspace onCreate={handleCreateWorkspace} loading={loading} />
    </div>
  );
};

export default Dashboard;
