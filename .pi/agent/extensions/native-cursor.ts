import { CustomEditor, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Input } from "@earendil-works/pi-tui";

// Also requires `"showHardwareCursor": true` in ~/.pi/agent/settings.json
// (or PI_HARDWARE_CURSOR=1) so the terminal/native cursor is visible.
//
// pi-tui renders a software cursor by wrapping the character under the cursor in
// reverse-video ANSI escapes. With the hardware cursor enabled, that gives us two
// cursors unless we strip the reverse-video wrapper from focused inputs.
const SOFTWARE_CURSOR_RE = /\x1b\[7m([^\x1b]*)\x1b\[(?:0|27)m/g;

// /reload re-evaluates this extension in the same process. Keep this guard on
// Input.prototype so we don't stack-wrap Input.render() each time the extension
// reloads.
const PATCHED_INPUT_RENDER = Symbol.for("pi.native-cursor.patched-input-render");

function removeSoftwareCursor(line: string): string {
  // Preserve the character that pi-tui put under the software cursor; only drop
  // the ANSI styling. The zero-width hardware cursor marker is not part of this
  // sequence, so native cursor positioning/IME support remains intact.
  return line.replace(SOFTWARE_CURSOR_RE, "$1");
}

function patchInputSoftwareCursor() {
  const proto = Input.prototype as typeof Input.prototype & {
    [PATCHED_INPUT_RENDER]?: true;
  };

  if (proto[PATCHED_INPUT_RENDER]) return;

  const render = proto.render;
  proto.render = function patchedNativeCursorInputRender(width: number) {
    // The /model picker and several other dialogs use pi-tui's generic Input
    // component instead of CustomEditor. Patch all Inputs so those dialogs don't
    // show the built-in software cursor alongside the native terminal cursor.
    return render.call(this, width).map(removeSoftwareCursor);
  };
  proto[PATCHED_INPUT_RENDER] = true;
}

class NativeCursorEditor extends CustomEditor {
  override render(width: number): string[] {
    // The main prompt editor is customizable through pi's extension API, so we
    // can strip its software cursor without monkey-patching the editor class.
    return super.render(width).map(removeSoftwareCursor);
  }
}

export default function (pi: ExtensionAPI) {
  patchInputSoftwareCursor();

  pi.on("session_start", (_event, ctx) => {
    ctx.ui.setEditorComponent((tui, theme, keybindings) => {
      tui.setShowHardwareCursor(true);
      return new NativeCursorEditor(tui, theme, keybindings);
    });
  });
}
