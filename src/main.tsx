import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import GrowApp from "./GrowApp.tsx";
import { isGrowSurface } from "./lib/appSurface";
import "./index.css";

const Root = isGrowSurface() ? GrowApp : App;

createRoot(document.getElementById("root")!).render(<Root />);
