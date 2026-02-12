import { useEffect, useState } from "react";
import type { Channel, WorkspaceMember } from "./api";
import {
  createChannel,
  createWorkspace,
  getChannels,
  getWorkspaces,
  loginUser,
  registerUser,
} from "./api";
import "./App.css";

type AuthView = "login" | "register";

const STORAGE_KEY = "rtw_auth";

function App() {
  const [authView, setAuthView] = useState<AuthView>("login");
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [workspaces, setWorkspaces] = useState<WorkspaceMember[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [channelName, setChannelName] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const stored = JSON.parse(raw) as { token: string; name: string };
      setToken(stored.token);
      setUserName(stored.name);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await getWorkspaces(token);
        setWorkspaces(items);
        const first = items[0]?.workspace?.id ?? null;
        setActiveWorkspaceId(first);
        if (first) {
          const channelList = await getChannels(token, first);
          setChannels(channelList);
        } else {
          setChannels([]);
        }
      } catch (err: unknown) {
        setError("Failed to load workspaces.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await loginUser({ email: loginEmail, password: loginPassword });
      setToken(data.token);
      setUserName(data.name);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: data.token, name: data.name })
      );
      setLoginPassword("");
    } catch (err: unknown) {
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await registerUser({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
      });
      setToken(data.token);
      setUserName(data.name);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: data.token, name: data.name })
      );
      setRegisterPassword("");
    } catch (err: unknown) {
      setError("Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUserName("");
    setWorkspaces([]);
    setChannels([]);
    setActiveWorkspaceId(null);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !workspaceName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createWorkspace(token, { name: workspaceName });
      const refreshed = await getWorkspaces(token);
      setWorkspaces(refreshed);
      setWorkspaceName("");
      setActiveWorkspaceId(created.id);
      const channelList = await getChannels(token, created.id);
      setChannels(channelList);
    } catch (err: unknown) {
      setError("Unable to create workspace.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorkspace = async (workspaceId: number) => {
    if (!token) return;
    setActiveWorkspaceId(workspaceId);
    setLoading(true);
    setError(null);
    try {
      const channelList = await getChannels(token, workspaceId);
      setChannels(channelList);
    } catch (err: unknown) {
      setError("Unable to load channels.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeWorkspaceId || !channelName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createChannel(token, {
        name: channelName,
        workspaceId: activeWorkspaceId,
      });
      const channelList = await getChannels(token, activeWorkspaceId);
      setChannels(channelList);
      setChannelName("");
    } catch (err: unknown) {
      setError("Unable to create channel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Realtime Workspace</p>
          <h1>Team spaces. Channels. Momentum.</h1>
        </div>
        {token ? (
          <div className="user-pill">
            <span>{userName}</span>
            <button className="ghost" onClick={handleLogout}>
              Log out
            </button>
          </div>
        ) : (
          <div className="pill">Welcome</div>
        )}
      </header>

      {error && <div className="alert">{error}</div>}

      {!token ? (
        <section className="auth">
          <div className="auth-tabs">
            <button
              className={authView === "login" ? "active" : ""}
              onClick={() => setAuthView("login")}
            >
              Login
            </button>
            <button
              className={authView === "register" ? "active" : ""}
              onClick={() => setAuthView("register")}
            >
              Register
            </button>
          </div>

          {authView === "login" ? (
            <form className="card" onSubmit={handleLogin}>
              <h2>Welcome back</h2>
              <label>
                Email
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          ) : (
            <form className="card" onSubmit={handleRegister}>
              <h2>Create your account</h2>
              <label>
                Name
                <input
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create account"}
              </button>
            </form>
          )}
        </section>
      ) : (
        <section className="dashboard">
          <aside className="panel">
            <div className="panel-header">
              <h2>Workspaces</h2>
              <span className="badge">{workspaces.length}</span>
            </div>
            <div className="list">
              {workspaces.length === 0 && (
                <p className="muted">No workspaces yet.</p>
              )}
              {workspaces.map((item) => (
                <button
                  key={item.id}
                  className={
                    item.workspace.id === activeWorkspaceId
                      ? "list-item active"
                      : "list-item"
                  }
                  onClick={() => handleSelectWorkspace(item.workspace.id)}
                >
                  <span>{item.workspace.name}</span>
                  <span className="role">{item.role}</span>
                </button>
              ))}
            </div>
            <form className="inline-form" onSubmit={handleCreateWorkspace}>
              <input
                placeholder="New workspace"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
              <button type="submit" disabled={loading}>
                Add
              </button>
            </form>
          </aside>

          <main className="panel">
            <div className="panel-header">
              <h2>Channels</h2>
              <span className="badge">{channels.length}</span>
            </div>
            {activeWorkspaceId ? (
              <>
                <div className="list">
                  {channels.length === 0 && (
                    <p className="muted">No channels yet.</p>
                  )}
                  {channels.map((channel) => (
                    <div key={channel.id} className="list-item">
                      <span># {channel.name}</span>
                    </div>
                  ))}
                </div>
                <form className="inline-form" onSubmit={handleCreateChannel}>
                  <input
                    placeholder="New channel"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                  />
                  <button type="submit" disabled={loading}>
                    Add
                  </button>
                </form>
              </>
            ) : (
              <p className="muted">Select a workspace to view channels.</p>
            )}
          </main>
        </section>
      )}
    </div>
  );
}

export default App;
