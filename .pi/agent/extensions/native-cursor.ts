import { CustomEditor, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Also requires `"showHardwareCursor": true` in ~/.pi/agent/settings.json
// (or PI_HARDWARE_CURSOR=1) so the terminal/native cursor is visible.
// Matches the reverse-video cursor block emitted by pi-tui's editor.
const SOFTWARE_CURSOR_RE = /\x1b\[7m([^\x1b]*)\x1b\[(?:0|27)m/g;

class NativeCursorEditor extends CustomEditor {
  override render(width: number): string[] {
    return super.render(width).map((line) => line.replace(SOFTWARE_CURSOR_RE, "$1"));
  }
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    ctx.ui.setEditorComponent((tui, theme, keybindings) => {
      tui.setShowHardwareCursor(true);
      return new NativeCursorEditor(tui, theme, keybindings);
    });
  });
}
