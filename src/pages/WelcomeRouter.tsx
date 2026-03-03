import { lazy } from "react";
import { useAppMode } from "@/contexts/AppModeContext";

const ClassicWelcome = lazy(() => import("./ClassicWelcome"));
const StarseedWelcome = lazy(() => import("./StarseedWelcome"));

const WelcomeRouter = () => {
  const { mode } = useAppMode();
  return mode === "starseed" ? <StarseedWelcome /> : <ClassicWelcome />;
};

export default WelcomeRouter;
