import { createContext, useContext } from "react";

interface LayoutCtx {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export const LayoutContext = createContext<LayoutCtx>({
  mobileOpen: false,
  setMobileOpen: () => {},
});

export const useLayout = () => useContext(LayoutContext);
