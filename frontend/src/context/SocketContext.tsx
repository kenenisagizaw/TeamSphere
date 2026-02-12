import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { AuthContext } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
}

export const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useContext(AuthContext)!;
  const [socket, setSocket] = useState<Socket | null>(null);

  // Type guard to check if user has a token property
  function getUserToken(user: any): string | undefined {
    return user && typeof user === "object" && "token" in user ? user.token : undefined;
  }

  useEffect(() => {
    if (user) {
      const token = getUserToken(user);
      const s = io("http://localhost:5000", {
        auth: { token },
      });
      setSocket(s);

      return () => {
        s.disconnect();
      };
    }
  }, [user]);

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
};
