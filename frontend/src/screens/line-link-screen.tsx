import { useState, useEffect } from "react";
import { useSearch } from "@tanstack/react-router";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

type LinkState = "loading" | "ready" | "success" | "error";

export function LineLinkScreen() {
  const search = useSearch({ strict: false }) as {
    token?: string;
    success?: string | boolean;
    error?: string;
    name?: string;
  };
  const [state, setState] = useState<LinkState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [linkedName, setLinkedName] = useState("");

  const { token, success, error, name } = search;

  useEffect(() => {
    if (success === true || success === "true") {
      setLinkedName(name || "");
      setState("success");
      return;
    }
    if (error) {
      const messages: Record<string, string> = {
        missing_params: "Missing required parameters.",
        link_failed:
          "Failed to link LINE account. The link may have expired.",
      };
      setErrorMessage(messages[error] || "An error occurred.");
      setState("error");
      return;
    }
    if (!token) {
      setErrorMessage("Invalid or missing link token.");
      setState("error");
      return;
    }
    setState("ready");
  }, [token, success, error, name]);

  const handleConnect = async () => {
    if (!token) return;
    setState("loading");
    try {
      const response = await apiClient.getV1LineAuthUrl({
        token,
      });
      window.location.href = response.data.authUrl;
    } catch {
      setErrorMessage("Failed to connect. Please try again.");
      setState("error");
    }
  };

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">TP</span>
            </div>
          </div>
          <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
            TutorPal
          </h1>
        </div>

        {state === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-on-surface-variant">
              Connecting to LINE...
            </p>
          </div>
        )}

        {state === "ready" && (
          <div className="space-y-6">
            <p className="text-on-surface-variant">
              Link your LINE account to receive schedule updates and
              notifications from your tutor.
            </p>
            <Button
              onClick={handleConnect}
              size="lg"
              className="w-full"
              style={{ backgroundColor: "#06C755" }}
            >
              Connect with LINE
            </Button>
          </div>
        )}

        {state === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <div className="space-y-1">
              <h2 className="font-headline font-bold text-xl text-on-surface">
                Linked Successfully!
              </h2>
              {linkedName && (
                <p className="text-on-surface-variant">
                  Connected as {linkedName}
                </p>
              )}
            </div>
            <p className="text-sm text-on-surface-variant">
              You can now close this page.
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-4">
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <div className="space-y-1">
              <h2 className="font-headline font-bold text-xl text-on-surface">
                Linking Failed
              </h2>
              <p className="text-on-surface-variant">{errorMessage}</p>
            </div>
            <p className="text-sm text-on-surface-variant">
              Please ask your tutor for a new link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
