"use client";

import type {
  CreateMessageResponse,
  Message,
  MessageCreatedEvent,
  MessagesResponse,
} from "@ci-cd-via-docker/shared";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { HTTP_SERVER_URL, WS_SERVER_URL } from "@/lib/config";

type ApiStatus = "checking" | "online" | "offline";
type SocketStatus = "connecting" | "connected" | "disconnected";

function isMessageCreatedEvent(value: unknown): value is MessageCreatedEvent {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<MessageCreatedEvent>;
  return candidate.type === "message.created" && candidate.data !== undefined;
}

export function MessageBoard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("connecting");
  const [notice, setNotice] = useState(
    "Waiting for the HTTP and WebSocket services.",
  );
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMessages() {
      try {
        const response = await fetch(`${HTTP_SERVER_URL}/messages`, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = (await response.json()) as MessagesResponse;
        setMessages(result.messages);
        setApiStatus("online");
        setNotice("Existing messages loaded from the HTTP server.");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;

        setApiStatus("offline");
        setNotice(
          "HTTP server is offline. We will connect it in the next project phase.",
        );
      }
    }

    void loadMessages();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const socket = new WebSocket(WS_SERVER_URL);

    socket.addEventListener("open", () => {
      setSocketStatus("connected");
      setNotice("Live updates are connected.");
    });

    socket.addEventListener("message", (event) => {
      try {
        const parsed: unknown = JSON.parse(String(event.data));
        if (!isMessageCreatedEvent(parsed)) return;

        setMessages((current) => {
          const exists = current.some(
            (message) => message.id === parsed.data.id,
          );
          return exists ? current : [parsed.data, ...current];
        });
      } catch {
        setNotice("The WebSocket server sent an unreadable event.");
      }
    });

    socket.addEventListener("close", () => {
      setSocketStatus("disconnected");
    });

    socket.addEventListener("error", () => {
      setSocketStatus("disconnected");
      setNotice(
        "WebSocket server is offline. We will connect it in a later phase.",
      );
    });

    return () => socket.close();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setNotice("Sending message…");

    try {
      const response = await fetch(`${HTTP_SERVER_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = (await response.json()) as CreateMessageResponse;
      setMessages((current) => {
        const exists = current.some(
          (message) => message.id === result.message.id,
        );
        return exists ? current : [result.message, ...current];
      });
      setDraft("");
      setApiStatus("online");
      setNotice("Message stored successfully.");
    } catch {
      setApiStatus("offline");
      setNotice(
        "Could not send the message because the HTTP server is offline.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="workspace" aria-label="Realtime message workspace">
      <div className="status-bar">
        <StatusBadge label="HTTP API" status={apiStatus} />
        <StatusBadge label="WebSocket" status={socketStatus} />
      </div>

      <div className="panel-grid">
        <form className="composer" onSubmit={handleSubmit}>
          <div>
            <p className="section-label">Create</p>
            <h2>Send a message</h2>
          </div>

          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            maxLength={280}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type something for the live feed…"
            rows={5}
            value={draft}
          />

          <div className="composer-footer">
            <span>{draft.length}/280</span>
            <button disabled={!draft.trim() || isSending} type="submit">
              {isSending ? "Sending…" : "Send message"}
            </button>
          </div>
        </form>

        <div className="feed">
          <div className="feed-heading">
            <div>
              <p className="section-label">Observe</p>
              <h2>Live feed</h2>
            </div>
            <span>{messages.length} messages</span>
          </div>

          <p className="notice" aria-live="polite">
            {notice}
          </p>

          {messages.length === 0 ? (
            <div className="empty-state">
              <span aria-hidden="true">◎</span>
              <h3>No messages yet</h3>
              <p>
                Once the backend phases are ready, stored and realtime messages
                will appear here.
              </p>
            </div>
          ) : (
            <ol className="message-list">
              {messages.map((message) => (
                <li key={message.id}>
                  <p>{message.content}</p>
                  <time dateTime={message.createdAt}>
                    {new Date(message.createdAt).toLocaleString()}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

interface StatusBadgeProps {
  label: string;
  status: ApiStatus | SocketStatus;
}

function StatusBadge({ label, status }: StatusBadgeProps) {
  const isOnline = status === "online" || status === "connected";
  const isPending = status === "checking" || status === "connecting";
  const stateLabel = isOnline ? "online" : isPending ? "checking" : "offline";

  return (
    <div className={`status-badge status-${stateLabel}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>{label}</span>
      <strong>{stateLabel}</strong>
    </div>
  );
}
