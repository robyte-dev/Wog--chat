import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "stream-chat-react/dist/css/v2/index.css";
import "./index.css";
import App from "./App.jsx";
import { LanguageProvider } from "./features/language/LanguageProvider.jsx";
import IntroAnimation from "./features/intro/IntroAnimation.jsx";

import { BrowserRouter } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations
      .filter((registration) => [registration.active, registration.waiting, registration.installing]
        .some((worker) => worker && new URL(worker.scriptURL).pathname === "/service-worker.js"))
      .forEach((registration) => registration.unregister());
  }).catch(() => {});
}

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <App />
          <IntroAnimation />
        </LanguageProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
