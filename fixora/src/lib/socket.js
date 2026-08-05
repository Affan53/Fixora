import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/api$/, "") + "/ws";

let client = null;

function getClient() {
  if (!client) {
    client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 3000,
    });
    client.activate();
  }
  return client;
}

/**
 * Subscribes to a topic, calling onMessage with the parsed JSON body of every
 * message. Returns an unsubscribe function — call it on cleanup/unmount.
 */
export function subscribe(topic, onMessage) {
  const c = getClient();
  let subscription = null;

  const trySubscribe = () => {
    subscription = c.subscribe(topic, (message) => {
      try {
        onMessage(JSON.parse(message.body));
      } catch (e) {
        console.error("WebSocket message parse error:", e);
      }
    });
  };

  if (c.connected) {
    trySubscribe();
  } else {
    c.onConnect = trySubscribe;
  }

  return () => {
    subscription?.unsubscribe();
  };
}
