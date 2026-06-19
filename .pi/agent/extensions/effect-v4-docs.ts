// TODO: Refactor this extension to work much more generically, following opencode's
// references feature: https://opencode.ai/docs/references/
// Discover relevant local/project docs, link them, and inject those references
// instead of hard-coding Effect v4 docs.
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const DOCS_PATH = join(homedir(), ".local", "share", "docs", "effect-smol");
const PROMPT_LINE = `Effect v4 source is available at ${DOCS_PATH}.`;

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function findNearestPackageJson(startDir: string): Promise<string | undefined> {
  let dir = startDir;

  while (true) {
    const candidate = join(dir, "package.json");
    if (await pathExists(candidate)) return candidate;

    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

function isEffectV4Spec(spec: unknown): boolean {
  if (typeof spec !== "string") return false;
  const normalized = spec.trim();

  return (
    /^(?:workspace:|npm:effect@)?\s*[~^<>= ]*4(?:\.|$|-)/.test(normalized) ||
    /(?:^|[^0-9])4\.[0-9]/.test(normalized)
  );
}

async function hasEffectV4Dependency(packageJsonPath: string): Promise<boolean> {
  try {
    const pkg = JSON.parse(await readFile(packageJsonPath, "utf8")) as Record<string, unknown>;
    const dependencyBlocks = [
      pkg.dependencies,
      pkg.devDependencies,
      pkg.peerDependencies,
      pkg.optionalDependencies,
    ];

    return dependencyBlocks.some((block) => {
      if (!block || typeof block !== "object") return false;
      return isEffectV4Spec((block as Record<string, unknown>).effect);
    });
  } catch {
    return false;
  }
}

export default function effectV4DocsExtension(pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event, ctx) => {
    const packageJsonPath = await findNearestPackageJson(ctx.cwd);
    if (!packageJsonPath || !(await hasEffectV4Dependency(packageJsonPath))) return;
    if (event.systemPrompt.includes(PROMPT_LINE)) return;

    return {
      systemPrompt: `${event.systemPrompt}\n${PROMPT_LINE}`,
    };
  });
}
