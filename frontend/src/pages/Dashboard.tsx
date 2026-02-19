import {
    FolderPlus,
    Grid,
    LogOut,
    Plus,
    Users,
    X
} from "lucide-react";
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
  const { token, logout } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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

  const handleLogout = () => {
    logout(); // clears auth state + localStorage (from context)
    navigate("/login");
  };

  const handleJoin = async (workspaceId: number) => {
    if (!token) return;
    setJoiningId(workspaceId);
    try {
      await joinWorkspace(token, workspaceId);
      setWorkspaces((prev) =>
        prev.map((ws) =>
          ws.id === workspaceId ? { ...ws, isMember: true } : ws
        )
      );
      setNotification({
        type: "success",
        message: "Successfully joined workspace!",
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({
        type: "error",
        message:
          err.response?.data?.message || "Failed to join workspace",
      });
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim() || !token) return;
    try {
      const created = await createWorkspace(token, { name: workspaceName });
      setWorkspaces((prev) => [
        { id: created.id, name: created.name, isMember: true },
        ...prev,
      ]);
      setWorkspaceName("");
      setModalOpen(false);
      setNotification({
        type: "success",
        message: "Workspace created successfully!",
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({
        type: "error",
        message:
          err.response?.data?.message || "Failed to create workspace",
      });
    }
  };

  const getWorkspaceInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getRandomGradient = (id: number) => {
    const gradients = [
      "from-blue-500 to-cyan-500",
      "from-purple-500 to-pink-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-purple-500",
      "from-yellow-500 to-orange-500",
    ];
    return gradients[id % gradients.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-lg shadow-md">
                <Grid className="text-white" size={24} />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                Your Workspaces
              </h1>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <Plus size={18} />
                Create Workspace
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Loading workspaces...
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-16">
            <FolderPlus
              className="text-blue-600 mx-auto mb-4"
              size={48}
            />
            <h2 className="text-xl font-semibold mb-2">
              No workspaces yet
            </h2>
            <p className="text-gray-500 mb-6">
              Create your first workspace to start collaborating.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="bg-white rounded-xl shadow-sm border p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`bg-gradient-to-br ${getRandomGradient(
                      ws.id
                    )} w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold`}
                  >
                    {getWorkspaceInitials(ws.name)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {ws.name}
                    </h2>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users size={14} />
                      Workspace
                    </div>
                  </div>
                </div>

                {ws.isMember ? (
                  <button
                    onClick={() =>
                      navigate(`/workspaces/${ws.id}`)
                    }
                    className="w-full bg-green-500 text-white px-4 py-2.5 rounded-lg"
                  >
                    Enter Workspace

              {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Create Workspace
                      </h3>
                      <button
                        onClick={() => setModalOpen(false)}
                        className="p-2 rounded-lg hover:bg-gray-100"
                        aria-label="Close"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <label className="text-sm font-medium text-gray-600">
                      Workspace name
                    </label>
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateWorkspace();
                      }}
                      placeholder="e.g. Product Team"
                      className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    />

                    <div className="mt-6 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModalOpen(false)}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateWorkspace}
                        disabled={!workspaceName.trim()}
                        className={
                          workspaceName.trim()
                            ? "px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            : "px-4 py-2 rounded-lg bg-blue-300 text-white cursor-not-allowed"
                        }
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoin(ws.id)}
                    disabled={joiningId === ws.id}
                    className="w-full bg-blue-500 text-white px-4 py-2.5 rounded-lg"
                  >
                    {joiningId === ws.id
                      ? "Joining..."
                      : "Join Workspace"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
