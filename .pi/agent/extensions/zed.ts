import { spawn } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	pi.registerCommand("zed", {
		description: "Open the current directory in Zed.",
		handler: async (_args, ctx) => {
			const cwd = ctx.sessionManager.getCwd();
			spawn("zed", [cwd], { stdio: "ignore", detached: true }).unref();
			ctx.ui.notify(`Opening ${cwd} in Zed`, "info");
		},
	});
}