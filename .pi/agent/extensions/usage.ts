import { spawn } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const OPENAI_CODEX_USAGE_URL = "https://chatgpt.com/codex/cloud/settings/analytics";
const OPENCODE_GO_USAGE_URL = "https://opencode.ai/workspace/wrk_01KEAQN24EQRHM0ECQYWKN811B/go";

export default function usageExtension(pi: ExtensionAPI) {
  pi.registerCommand("usage", {
    description: "Open usage analytics for the current provider in your browser",
    handler: async (_args, ctx) => {
      let usageUrl: string | undefined;

      if (ctx.model?.provider === "openai-codex") {
        usageUrl = OPENAI_CODEX_USAGE_URL;
      } else if (ctx.model?.provider === "opencode-go") {
        usageUrl = OPENCODE_GO_USAGE_URL;
      }

      if (!usageUrl) {
        ctx.ui.notify(
          `No usage URL configured for provider ${ctx.model?.provider ?? "unknown"}`,
          "error",
        );
        return;
      }

      const child = spawn("open", [usageUrl], {
        detached: true,
        stdio: "ignore",
      });
      child.unref();

    },
  });
}
