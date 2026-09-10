import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import App from "./App";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import { GlobalProvider } from "./context/GlobalState";
import { SmartwatchProvider } from "./context/SmartwatchContext";
import "driver.js/dist/driver.css";
import "./index.css";
import { TourProvider } from "./context/TourContext";

// Inicialización opcional y ligera de Sentry para producción
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE || "production",
    tracesSampleRate: 0.2,
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <GlobalProvider>
          <SmartwatchProvider>
            <TourProvider>
              <App />
            </TourProvider>
          </SmartwatchProvider>
        </GlobalProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
