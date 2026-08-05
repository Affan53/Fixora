import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  define: {
    // sockjs-client references Node's `global` object, which doesn't exist
    // in the browser — without this, the app crashes on load with
    // "ReferenceError: global is not defined" the moment any page imports
    // the WebSocket client.
    global: "globalThis",
  },
});
