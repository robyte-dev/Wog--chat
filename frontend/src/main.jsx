import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "stream-chat-react/dist/css/v2/index.css";
import "./index.css";
import App from "./App.jsx";
import { LanguageProvider } from "./features/language/LanguageProvider.jsx";
import IntroAnimation from "./features/intro/IntroAnimation.jsx";

import { BrowserRouter } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
