import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("pop", {
    description: "Jump back to the previous user message without creating a branch summary",
    handler: async (_args, ctx) => {
      await ctx.waitForIdle();

      const branch = ctx.sessionManager.getBranch();
      const previousUserEntry = [...branch]
        .reverse()
        .find(
          (entry: any) =>
            entry.type === "message" && entry.message?.role === "user",
        );

      if (!previousUserEntry) {
        ctx.ui.notify("No previous user message found.", "warning");
        return;
      }

      const result = await ctx.navigateTree(previousUserEntry.id, {
        summarize: false,
      });

      if (result.cancelled) {
        ctx.ui.notify("/pop cancelled.", "warning");
      }
    },
  });
}
