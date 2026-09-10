import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

/** The Google script loads asynchronously: we wait for it instead of checking once. */
const POLL_MS = 120;
const TIMEOUT_MS = 12000;

type ScriptState = "waiting" | "ready" | "unavailable";

export default function LoginPage() {
  const { user, loginWithGoogleIdToken } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<ScriptState>("waiting");
  const [attempt, setAttempt] = useState(0);

  // The callback is kept in a ref: the effect must not re-run
  // (and redraw the button) on every re-render of the auth context.
  const loginRef = useRef(loginWithGoogleIdToken);
  loginRef.current = loginWithGoogleIdToken;

  const rendered = useRef(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    const startedAt = Date.now();

    function draw() {
      const id = window.google?.accounts?.id;
      if (!id || !buttonRef.current || rendered.current) return false;

      id.initialize({
        client_id: GOOGLE_CLIENT_ID as string,
        callback: async (response) => {
          try {
            await loginRef.current(response.credential);
          } catch (err) {
            if (err instanceof ApiError) {
              setError(
                err.status === 0
                  ? err.message
                  : err.message || "Sign-in refused. Check that your account is authorized."
              );
            } else {
              setError("An unexpected error occurred.");
            }
          }
        },
      });

      id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "signin_with",
        locale: "en",
      });

      rendered.current = true;
      return true;
    }

    if (draw()) {
      setScript("ready");
      return;
    }

    // The script isn't there yet: keep retrying until it arrives.
    // Past the timeout, warn the user but keep watching — a very slow
    // network sometimes delivers it eventually, and it would be absurd
    // to have given up right before that.
    const timer = setInterval(() => {
      if (cancelled) return;
      if (draw()) {
        setScript("ready");
        clearInterval(timer);
      } else if (Date.now() - startedAt > TIMEOUT_MS) {
        setScript("unavailable");
      }
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [attempt]);

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login">
      <div className="login-card">
        <div className="brand" style={{ margin: "0 auto" }}>
          CP
        </div>
        <h1>Contact Platform</h1>
        <p>Sign in with your professional Google account.</p>

        {!GOOGLE_CLIENT_ID && (
          <p className="error-text">
            VITE_GOOGLE_CLIENT_ID is not configured (see .env.example).
          </p>
        )}

        {/* The container stays mounted permanently: it's what the Google
            script fills in as soon as it's available. */}
        <div ref={buttonRef} style={{ display: "flex", justifyContent: "center", minHeight: 44 }} />

        {GOOGLE_CLIENT_ID && script === "waiting" && (
          <p className="muted" style={{ fontSize: 13.5, marginTop: 12 }}>
            Loading Google sign-in button...
          </p>
        )}

        {GOOGLE_CLIENT_ID && script === "unavailable" && (
          <div style={{ marginTop: 12 }}>
            <p className="error-text" style={{ marginBottom: 10 }}>
              The Google sign-in script could not be loaded
              (accounts.google.com may be blocked by the network or an extension).
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                rendered.current = false;
                setScript("waiting");
                setAttempt((a) => a + 1);
              }}
            >
              Retry
            </button>
          </div>
        )}

        {error && (
          <p className="error-text" style={{ marginTop: 14 }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
