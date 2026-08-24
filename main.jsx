import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import MauriOneApp from "./MauriOneMotion.jsx";
import ShowroomAdmin from "./ShowroomAdmin.jsx";

function RootRouter() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onRoute = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onRoute);
    return () => window.removeEventListener("popstate", onRoute);
  }, []);

  const isAdminRoute = path === "/admin" || path.startsWith("/admin/");
  return isAdminRoute ? <ShowroomAdmin /> : <MauriOneApp />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootRouter />
  </React.StrictMode>
);
