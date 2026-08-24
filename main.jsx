import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import MauriOneApp from "./MauriOne.jsx";

function MauriOneOfficialTheme() {
  useEffect(() => {
    let applied = false;
    const applyOfficialLightMode = () => {
      if (applied) return true;
      const themeButton = document.querySelector('button[aria-label="theme"]');
      if (!themeButton) return false;
      themeButton.click();
      applied = true;
      return true;
    };

    if (applyOfficialLightMode()) return undefined;

    const observer = new MutationObserver(() => {
      if (applyOfficialLightMode()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return <MauriOneApp />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MauriOneOfficialTheme />
  </React.StrictMode>
);
