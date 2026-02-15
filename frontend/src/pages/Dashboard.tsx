import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createWorkspace, getWorkspaces, joinWorkspace } from "../api";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Fetch workspaces on load
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

  // Join workspace
  const handleJoin = async (workspaceId: number) => {
    if (!token) return;
    setActionLoading(true);
    try {
      await joinWorkspace(token, workspaceId);
      setWorkspaces((prev) =>
        prev.map((ws) =>
          ws.id === workspaceId ? { ...ws, isMember: true } : ws
        )
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to join workspace");
    } finally {
      setActionLoading(false);
    }
  };

  // Create workspace
  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim() || !token) return;
    setActionLoading(true);
    try {
      const created = await createWorkspace(token, { name: workspaceName });
      setWorkspaces((prev) => [
        { id: created.id, name: created.name, isMember: true },
        ...prev,
      ]);
      setWorkspaceName("");
      setModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create workspace");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Workspaces</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
        >
          + Create Workspace
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border p-4 rounded-lg animate-pulse bg-gray-200 h-24"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className="border p-4 rounded-lg hover:shadow-lg transition flex justify-between items-center bg-white"
            >
              <h2 className="text-lg font-semibold truncate max-w-xs">
                {ws.name}
              </h2>
              {ws.isMember ? (
                <button
                  onClick={() => navigate(`/workspaces/${ws.id}`)}
                  disabled={actionLoading}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition disabled:opacity-50"
                >
                  Enter
                </button>
              ) : (
                <button
                  onClick={() => handleJoin(ws.id)}
                  disabled={actionLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition disabled:opacity-50"
                >
                  Join
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Workspace Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Create Workspace</h3>
            <input
              type="text"
              className="border w-full p-2 rounded mb-4"
              placeholder="Workspace name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCreateWorkspace}
                disabled={actionLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded border hover:bg-gray-100 transition"
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

export default Dashboard;
