import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const GPT_55_LEVEL = "low" as const;
const DEFAULT_LEVEL = "medium" as const;

export default function (pi: ExtensionAPI) {
  pi.on("model_select", async (event) => {
    const current = `${event.model.provider}/${event.model.id}`;
    const previous = event.previousModel
      ? `${event.previousModel.provider}/${event.previousModel.id}`
      : undefined;

    if (current === "openai-codex/gpt-5.5") {
      if (pi.getThinkingLevel() !== GPT_55_LEVEL) {
        pi.setThinkingLevel(GPT_55_LEVEL);
      }
    } else if (previous === "openai-codex/gpt-5.5") {
      if (pi.getThinkingLevel() !== DEFAULT_LEVEL) {
        pi.setThinkingLevel(DEFAULT_LEVEL);
      }
    }
  });
}
