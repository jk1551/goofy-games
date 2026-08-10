import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SnackbarProvider } from "notistack";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SnackbarProvider
      maxSnack={4}
      autoHideDuration={5000}
      preventDuplicate
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <App />
    </SnackbarProvider>
  </StrictMode>
);
