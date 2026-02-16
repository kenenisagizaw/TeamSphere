import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createWorkspace, getWorkspaces, joinWorkspace } from "../api";
import { useAuth } from "../context/AuthContext";
import { 
  Plus, 
  LogIn, 
  ArrowRight, 
  X, 
  Loader2,
  Grid,
  Users,
  Sparkles,
  FolderPlus,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

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
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    
    if (modalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [modalOpen]);

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
      setNotification({ type: 'success', message: 'Successfully joined workspace!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || "Failed to join workspace" });
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
      setNotification({ type: 'success', message: 'Workspace created successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || "Failed to create workspace" });
    }
  };

  const getWorkspaceInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomGradient = (id: number) => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-yellow-500 to-orange-500',
    ];
    return gradients[id % gradients.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Notification Toast */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-slide-down ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-lg shadow-md">
                <Grid className="text-white" size={24} />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Your Workspaces
              </h1>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                {workspaces.length} total
              </span>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
              Create Workspace
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
              </div>
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-12 max-w-2xl mx-auto border border-blue-100">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                <FolderPlus className="text-blue-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">No workspaces yet</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create your first workspace to start collaborating with your team and managing your projects.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 group"
              >
                <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                Create Your First Workspace
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          // Workspace Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-transparent transition-all duration-300 overflow-hidden"
              >
                <div className={`bg-gradient-to-r ${getRandomGradient(ws.id)} h-2`}></div>
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`bg-gradient-to-br ${getRandomGradient(ws.id)} w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                      {getWorkspaceInitials(ws.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-gray-800 truncate mb-1">
                        {ws.name}
                      </h2>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users size={14} />
                        <span>Workspace</span>
                      </div>
                    </div>
                  </div>
                  
                  {ws.isMember ? (
                    <button
                      onClick={() => navigate(`/workspaces/${ws.id}`)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group/btn"
                    >
                      Enter Workspace
                      <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(ws.id)}
                      disabled={joiningId === ws.id}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {joiningId === ws.id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <LogIn size={16} />
                          Join Workspace
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm transition-opacity"
              onClick={() => setModalOpen(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2" id="modal-title">
                    <FolderPlus size={20} />
                    Create New Workspace
                  </h3>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="bg-white px-6 py-8">
                <div className="mb-6">
                  <label htmlFor="workspace-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    id="workspace-name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="e.g., Marketing Team, Product Development"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Choose a descriptive name that your team will recognize.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreateWorkspace}
                    disabled={!workspaceName.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    Create Workspace
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add custom animations */}
      <style>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;