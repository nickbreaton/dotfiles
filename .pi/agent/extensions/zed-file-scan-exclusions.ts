import type { AutocompleteItem, AutocompleteProvider } from "@earendil-works/pi-tui";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { homedir } from "node:os";

const SETTINGS_PATH = join(".zed", "settings.json");
const GLOBAL_SETTINGS_PATH = join(homedir(), ".config", "zed", "settings.json");

type Matcher = (path: string) => boolean;

interface CacheEntry {
	mtimeMs: number;
	matchers: Matcher[];
}

const cache = new Map<string, CacheEntry>();

export default function (pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		ctx.ui.addAutocompleteProvider((current) => wrapAutocompleteProvider(current, ctx.sessionManager.getCwd()));
	});
}

function wrapAutocompleteProvider(current: AutocompleteProvider, cwd: string): AutocompleteProvider {
	return {
		async getSuggestions(lines, cursorLine, cursorCol, options) {
			const suggestions = await current.getSuggestions(lines, cursorLine, cursorCol, options);
			if (!suggestions || !isAtReference(lines, cursorLine, cursorCol, suggestions.prefix)) {
				return suggestions;
			}

			const projectSettingsFile = findZedSettings(cwd);
			const settingsFiles = [existsSync(GLOBAL_SETTINGS_PATH) ? GLOBAL_SETTINGS_PATH : null, projectSettingsFile].filter(
				(file): file is string => Boolean(file),
			);
			if (settingsFiles.length === 0) return suggestions;

			const root = projectSettingsFile ? dirname(dirname(projectSettingsFile)) : resolve(cwd);
			const matchers = settingsFiles.flatMap(loadMatchers);
			if (matchers.length === 0) return suggestions;

			const items = suggestions.items.filter((item) => !isExcludedItem(item, root, matchers));
			return items.length === 0 ? null : { ...suggestions, items };
		},

		applyCompletion(lines, cursorLine, cursorCol, item, prefix) {
			return current.applyCompletion(lines, cursorLine, cursorCol, item, prefix);
		},

		shouldTriggerFileCompletion(lines, cursorLine, cursorCol) {
			return current.shouldTriggerFileCompletion?.(lines, cursorLine, cursorCol) ?? true;
		},
	};
}

function isAtReference(lines: string[], cursorLine: number, cursorCol: number, prefix: string): boolean {
	if (prefix.startsWith("@")) return true;
	const beforeCursor = (lines[cursorLine] ?? "").slice(0, cursorCol);
	return beforeCursor.endsWith(prefix) && beforeCursor.slice(0, -prefix.length).endsWith("@");
}

function findZedSettings(cwd: string): string | null {
	let dir = resolve(cwd);
	while (true) {
		const candidate = join(dir, SETTINGS_PATH);
		if (existsSync(candidate)) return candidate;
		const parent = dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
}

function loadMatchers(settingsFile: string): Matcher[] {
	try {
		const stat = statSync(settingsFile);
		const cached = cache.get(settingsFile);
		if (cached && cached.mtimeMs === stat.mtimeMs) return cached.matchers;

		const raw = readFileSync(settingsFile, "utf8");
		const parsed = JSON.parse(stripJsonc(raw));
		const patterns = normalizeExclusions(parsed?.file_scan_exclusions);
		const matchers = patterns.map(globMatcher);
		cache.set(settingsFile, { mtimeMs: stat.mtimeMs, matchers });
		return matchers;
	} catch {
		return [];
	}
}

function normalizeExclusions(value: unknown): string[] {
	if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.length > 0);
	if (value && typeof value === "object") {
		return Object.entries(value)
			.filter(([, enabled]) => enabled !== false)
			.map(([pattern]) => pattern)
			.filter(Boolean);
	}
	return [];
}

function isExcludedItem(item: AutocompleteItem, root: string, matchers: Matcher[]): boolean {
	const raw = item.value || item.label;
	const withoutAt = raw.replace(/^@"?/, "").replace(/"$/, "");
	const abs = isAbsolute(withoutAt) ? withoutAt : join(root, withoutAt);
	const rel = toPosix(relative(root, abs));
	return rel.length > 0 && matchers.some((matches) => matches(rel) || matches(`${rel}/`));
}

function globMatcher(pattern: string): Matcher {
	let normalized = toPosix(pattern).replace(/^\/+/, "");
	if (normalized.endsWith("/")) normalized += "**";
	if (!normalized.includes("/")) normalized = `**/${normalized}`;

	const regex = new RegExp(`^${globToRegex(normalized)}(?:/.*)?$`);
	return (path) => regex.test(toPosix(path).replace(/^\/+/, ""));
}

function globToRegex(glob: string): string {
	let out = "";
	for (let i = 0; i < glob.length; i++) {
		const char = glob[i]!;
		const next = glob[i + 1];
		if (char === "*" && next === "*") {
			if (glob[i + 2] === "/") {
				out += "(?:.*/)?";
				i += 2;
			} else {
				out += ".*";
				i++;
			}
		} else if (char === "*") {
			out += "[^/]*";
		} else if (char === "?") {
			out += "[^/]";
		} else {
			out += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
		}
	}
	return out;
}

function stripJsonc(input: string): string {
	return input
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.replace(/(^|[^:])\/\/.*$/gm, "$1")
		.replace(/,\s*([}\]])/g, "$1");
}

function toPosix(path: string): string {
	return path.replace(/\\/g, "/");
}
