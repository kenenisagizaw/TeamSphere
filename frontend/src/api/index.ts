import api from "./axios";

export interface AuthResponse {
  id: number;
  name: string;
  email: string;
  token: string;
}

export interface Workspace {
  id: number;
  name: string;
  ownerId: number;
  createdAt?: string;
}

export interface WorkspaceMember {
  id: number;
  userId: number;
  workspaceId: number;
  role: string;
  workspace: Workspace;
}

export interface Channel {
  id: number;
  name: string;
  workspaceId: number;
  createdAt?: string;
}

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
}) => {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
};

export const loginUser = async (payload: {
  email: string;
  password: string;
}) => {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
};

export const getWorkspaces = async (token: string) => {
  const { data } = await api.get<WorkspaceMember[]>(
    "/workspaces",
    authHeaders(token)
  );
  return data;
};

export const createWorkspace = async (
  token: string,
  payload: { name: string }
) => {
  const { data } = await api.post<Workspace>(
    "/workspaces",
    payload,
    authHeaders(token)
  );
  return data;
};

export const getChannels = async (token: string, workspaceId: number) => {
  const { data } = await api.get<Channel[]>(
    `/channels/${workspaceId}`,
    authHeaders(token)
  );
  return data;
};

export const createChannel = async (
  token: string,
  payload: { name: string; workspaceId: number }
) => {
  const { data } = await api.post<Channel>(
    "/channels",
    payload,
    authHeaders(token)
  );
  return data;
};
