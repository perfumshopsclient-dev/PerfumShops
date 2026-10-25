import { createContext, useContext } from "react";

export const ContextoAuth = createContext(null);

export function useAuth() {
  return useContext(ContextoAuth);
}