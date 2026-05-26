import { spawn } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const USAGE_URL = "https://chatgpt.com/codex/cloud/settings/analytics";

export default function usageExtension(pi: ExtensionAPI) {
  pi.registerCommand("usage", {
    description: "Open ChatGPT Codex usage analytics in your browser",
    handler: async (_args, ctx) => {
      const child = spawn("open", [USAGE_URL], {
        detached: true,
        stdio: "ignore",
      });
      child.unref();

      ctx.ui.notify(`Opened ${USAGE_URL}`, "info");
    },
  });
}
