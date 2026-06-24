const HELP_URL = "https://en.wikipedia.org/wiki/Windows_Notepad";

const MENUS = {
  file: [
    { action: "new", label: "New", shortcut: "Ctrl+N" },
    { action: "open", label: "Open...", shortcut: "Ctrl+O" },
    { type: "separator" },
    { action: "save", label: "Save", shortcut: "Ctrl+S" },
    { action: "save-as", label: "Save As..." },
    { type: "separator" },
    { action: "print", label: "Print..." },
    { type: "separator" },
    { action: "exit", label: "Exit" },
  ],
  edit: [
    { action: "undo", label: "Undo", shortcut: "Ctrl+Z" },
    { type: "separator" },
    { action: "cut", label: "Cut", shortcut: "Ctrl+X" },
    { action: "copy", label: "Copy", shortcut: "Ctrl+C" },
    { action: "paste", label: "Paste", shortcut: "Ctrl+V" },
    { action: "delete", label: "Delete", shortcut: "Del" },
    { type: "separator" },
    { action: "select-all", label: "Select All", shortcut: "Ctrl+A" },
    { action: "time-date", label: "Time/Date", shortcut: "F5" },
  ],
  help: [
    { action: "help-topics", label: "Help Topics" },
    { type: "separator" },
    { action: "about", label: "About Notepad" },
  ],
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getEditor(windowManager, windowItem) {
  return windowManager
    .getWindowElement(windowItem.id)
    ?.querySelector(`[data-notepad-editor="${windowItem.id}"]`);
}

function getFileInput(windowManager, windowItem) {
  return windowManager
    .getWindowElement(windowItem.id)
    ?.querySelector(`[data-notepad-file-input="${windowItem.id}"]`);
}

function closeMenus(windowItem) {
  windowItem.data.activeMenu = null;
}

function syncNotepad(windowManager, windowItem) {
  closeMenus(windowItem);
  windowManager.syncAppWindow(windowItem.id);
}

function closeSaveAsDialog(windowItem) {
  windowItem.data.isSaveAsOpen = false;
}

function openSaveAsDialog(windowItem) {
  windowItem.data.saveAsValue = windowItem.data.fileName;
  windowItem.data.isSaveAsOpen = true;
}

function saveNotepadFile(windowItem, windowManager, system, nextFileName = windowItem.data.fileName) {
  if (typeof system?.saveAppFile === "function") {
    const result = system.saveAppFile({
      appId: "notepad",
      fileName: nextFileName,
      content: windowItem.data.content,
      fileRef: windowItem.data.fileRef,
    });

    if (result) {
      windowItem.data.fileName = result.fileName;
      windowItem.data.fileRef = result.fileRef;
      syncNotepad(windowManager, windowItem);
      return true;
    }
  }

  triggerDownload(nextFileName, windowItem.data.content);
  syncNotepad(windowManager, windowItem);
  return true;
}

function triggerDownload(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  }) + ` ${now.toLocaleDateString()}`;
}

function replaceSelection(editor, nextValue, replacement = "") {
  const start = editor.selectionStart ?? 0;
  const end = editor.selectionEnd ?? start;
  const value = nextValue ?? editor.value;

  editor.value = value.slice(0, start) + replacement + value.slice(end);
  const caret = start + replacement.length;
  editor.selectionStart = caret;
  editor.selectionEnd = caret;
}

async function writeClipboardText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return document.execCommand("copy");
    }
  }

  return document.execCommand("copy");
}

async function readClipboardText() {
  if (navigator.clipboard?.readText) {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return "";
    }
  }

  return "";
}

function printContent(title, content) {
  const printWindow = window.open("", "_blank", "width=720,height=540");
  if (!printWindow) {
    return false;
  }

  printWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(title)}</title>
        <style>
          body { margin: 24px; font-family: "Courier New", Courier, monospace; white-space: pre-wrap; }
        </style>
      </head>
      <body>${escapeHtml(content)}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}

function renderMenu(menuName, items, activeMenu) {
  const isOpen = activeMenu === menuName;

  return `
    <div class="notepad-app__menu-slot">
      <button
        class="notepad-app__menu-item"
        type="button"
        role="menuitem"
        aria-haspopup="true"
        aria-expanded="${String(isOpen)}"
        data-notepad-menu-toggle="${menuName}"
      >
        ${menuName[0].toUpperCase()}${menuName.slice(1)}
      </button>
      <div
        class="notepad-app__dropdown ${isOpen ? "" : "notepad-app__dropdown--hidden"}"
        data-notepad-menu="${menuName}"
        role="menu"
        aria-hidden="${String(!isOpen)}"
      >
        ${items
          .map((item) => {
            if (item.type === "separator") {
              return `<div class="notepad-app__dropdown-divider" aria-hidden="true"></div>`;
            }

            return `
              <button
                class="notepad-app__dropdown-item"
                type="button"
                role="menuitem"
                data-notepad-action="${item.action}"
              >
                <span>${item.label}</span>
                <span class="notepad-app__shortcut">${item.shortcut ?? ""}</span>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

async function handleMenuAction(action, windowItem, windowManager, system = null) {
  if (action === "new") {
    windowItem.data.content = "";
    windowItem.data.fileName = "Untitled.txt";
    windowItem.data.fileRef = null;
    syncNotepad(windowManager, windowItem);
    getEditor(windowManager, windowItem)?.focus();
    return true;
  }

  if (action === "open") {
    const input = getFileInput(windowManager, windowItem);
    if (!input) {
      return true;
    }

    input.value = "";
    closeMenus(windowItem);
    windowManager.syncAppWindow(windowItem.id);
    input.click();
    return true;
  }

  if (action === "save") {
    return saveNotepadFile(windowItem, windowManager, system);
  }

  if (action === "save-as") {
    openSaveAsDialog(windowItem);
    syncNotepad(windowManager, windowItem);
    return true;
  }

  if (action === "print") {
    printContent(windowItem.data.fileName, windowItem.data.content);
    syncNotepad(windowManager, windowItem);
    return true;
  }

  if (action === "exit") {
    windowManager.closeWindow(windowItem.id);
    return true;
  }

  if (action === "help-topics") {
    window.open(HELP_URL, "_blank", "noopener,noreferrer");
    syncNotepad(windowManager, windowItem);
    return true;
  }

  if (action === "about") {
    windowItem.data.isAboutOpen = true;
    syncNotepad(windowManager, windowItem);
    return true;
  }

  const editor = getEditor(windowManager, windowItem);
  if (!editor) {
    return false;
  }

  editor.focus();

  if (action === "undo") {
    document.execCommand("undo");
    windowItem.data.content = editor.value;
    syncNotepad(windowManager, windowItem);
    return true;
  }

  if (action === "cut") {
    const selection = editor.value.slice(editor.selectionStart, editor.selectionEnd);
    if (selection) {
      await writeClipboardText(selection);
      replaceSelection(editor, editor.value);
      windowItem.data.content = editor.value;
    }
    syncNotepad(windowManager, windowItem);
    return true;
  }

  if (action === "copy") {
    const selection = editor.value.slice(editor.selectionStart, editor.selectionEnd);
    if (selection) {
      await writeClipboardText(selection);
    }
    syncNotepad(windowManager, windowItem);
    return true;
  }

  if (action === "paste") {
    const clipboardText = await readClipboardText();
    if (clipboardText) {
      editor.setRangeText(clipboardText, editor.selectionStart, editor.selectionEnd, "end");
      windowItem.data.content = editor.value;
    }
    syncNotepad(windowManager, windowItem);
    return true;
  }

  if (action === "delete") {
    replaceSelection(editor, editor.value);
    windowItem.data.content = editor.value;
    syncNotepad(windowManager, windowItem);
    return true;
  }

  if (action === "select-all") {
    editor.select();
    syncNotepad(windowManager, windowItem);
    return true;
  }

  if (action === "time-date") {
    editor.setRangeText(getTimestamp(), editor.selectionStart, editor.selectionEnd, "end");
    windowItem.data.content = editor.value;
    syncNotepad(windowManager, windowItem);
    return true;
  }

  return false;
}

export const notepadApp = {
  id: "notepad",
  title: "Notepad",
  icon: "./res/png/notepad-0.png",
  defaultSize: {
    width: 624,
    height: 432,
  },
  minSize: {
    width: 384,
    height: 288,
  },
  defaultPosition: {
    x: 168,
    y: 86,
  },
  createState() {
    return {
      content: "",
      activeMenu: null,
      fileName: "Untitled.txt",
      fileRef: null,
      isAboutOpen: false,
      isSaveAsOpen: false,
      saveAsValue: "Untitled.txt",
    };
  },
  applyOpenOptions(windowItem, options) {
    if (typeof options.fileName === "string" && options.fileName.trim()) {
      windowItem.data.fileName = options.fileName.trim();
    }

    if (typeof options.content === "string") {
      windowItem.data.content = options.content;
    }

    windowItem.data.fileRef = options.fileRef ?? null;

    windowItem.data.activeMenu = null;
    windowItem.data.isAboutOpen = false;
    windowItem.data.isSaveAsOpen = false;
    windowItem.data.saveAsValue = windowItem.data.fileName;
  },
  render(windowItem) {
    const { activeMenu, content, fileName, isAboutOpen, isSaveAsOpen, saveAsValue } = windowItem.data;

    return `
      <div class="notepad-app" data-notepad-window="${windowItem.id}">
        <div class="notepad-app__menu" role="menubar" aria-label="Notepad menu">
          ${renderMenu("file", MENUS.file, activeMenu)}
          ${renderMenu("edit", MENUS.edit, activeMenu)}
          ${renderMenu("help", MENUS.help, activeMenu)}
        </div>
        <textarea
          class="notepad-app__editor"
          data-notepad-editor="${windowItem.id}"
          spellcheck="false"
        >${escapeHtml(content)}</textarea>
        <input
          class="notepad-app__file-input"
          data-notepad-file-input="${windowItem.id}"
          type="file"
          accept=".txt,.md,.json,.js,.ts,.css,.html,text/plain"
          aria-hidden="true"
          tabindex="-1"
        >
        <div
          class="notepad-app__dialog-layer ${isAboutOpen ? "" : "notepad-app__dialog-layer--hidden"}"
          data-notepad-about
          aria-hidden="${String(!isAboutOpen)}"
        >
          <section class="notepad-app__dialog win95-panel" role="dialog" aria-modal="true" aria-labelledby="notepad-about-title-${windowItem.id}">
            <div class="notepad-app__dialog-body">
              <img class="notepad-app__dialog-icon" src="./res/png/notepad-0.png" alt="" width="32" height="32">
              <div class="notepad-app__dialog-copy">
                <h2 id="notepad-about-title-${windowItem.id}" class="notepad-app__dialog-title">About Notepad</h2>
                <p class="notepad-app__dialog-text">Windows 95-style Notepad for quick plain text editing.</p>
                <p class="notepad-app__dialog-text">Current file: <span data-notepad-file-name>${escapeHtml(fileName)}</span></p>
              </div>
            </div>
            <div class="notepad-app__dialog-actions">
              <button class="win95-button" type="button" data-notepad-about-close>OK</button>
            </div>
          </section>
        </div>
        <div
          class="notepad-app__dialog-layer ${isSaveAsOpen ? "" : "notepad-app__dialog-layer--hidden"}"
          data-notepad-save-as
          aria-hidden="${String(!isSaveAsOpen)}"
        >
          <section class="notepad-app__dialog win95-panel" role="dialog" aria-modal="true" aria-labelledby="notepad-save-as-title-${windowItem.id}">
            <div class="notepad-app__dialog-body">
              <img class="notepad-app__dialog-icon" src="./res/png/notepad_file-0.png" alt="" width="32" height="32">
              <div class="notepad-app__dialog-copy">
                <h2 id="notepad-save-as-title-${windowItem.id}" class="notepad-app__dialog-title">Save As</h2>
                <label class="notepad-app__field-label" for="notepad-save-as-input-${windowItem.id}">File name</label>
                <input
                  id="notepad-save-as-input-${windowItem.id}"
                  class="notepad-app__field"
                  type="text"
                  value="${escapeHtml(saveAsValue)}"
                  data-notepad-save-as-input="${windowItem.id}"
                >
              </div>
            </div>
            <div class="notepad-app__dialog-actions">
              <button class="win95-button" type="button" data-notepad-save-as-confirm>Save</button>
              <button class="win95-button" type="button" data-notepad-save-as-cancel>Cancel</button>
            </div>
          </section>
        </div>
      </div>
    `;
  },
  sync(element, windowItem) {
    const root = element.querySelector(`[data-notepad-window="${windowItem.id}"]`);
    const editor = root?.querySelector(`[data-notepad-editor="${windowItem.id}"]`);

    if (!root || !editor) {
      return;
    }

    if (document.activeElement !== editor && editor.value !== windowItem.data.content) {
      editor.value = windowItem.data.content;
    }

    root.querySelectorAll("[data-notepad-menu-toggle]").forEach((button) => {
      const isExpanded = button.dataset.notepadMenuToggle === windowItem.data.activeMenu;
      button.setAttribute("aria-expanded", String(isExpanded));
    });

    root.querySelectorAll("[data-notepad-menu]").forEach((menu) => {
      const isActive = menu.dataset.notepadMenu === windowItem.data.activeMenu;
      menu.classList.toggle("notepad-app__dropdown--hidden", !isActive);
      menu.setAttribute("aria-hidden", String(!isActive));
    });

    const dialogLayer = root.querySelector("[data-notepad-about]");
    if (dialogLayer) {
      dialogLayer.classList.toggle("notepad-app__dialog-layer--hidden", !windowItem.data.isAboutOpen);
      dialogLayer.setAttribute("aria-hidden", String(!windowItem.data.isAboutOpen));
    }

    const saveAsLayer = root.querySelector("[data-notepad-save-as]");
    if (saveAsLayer) {
      saveAsLayer.classList.toggle("notepad-app__dialog-layer--hidden", !windowItem.data.isSaveAsOpen);
      saveAsLayer.setAttribute("aria-hidden", String(!windowItem.data.isSaveAsOpen));
    }

    const fileNameText = root.querySelector("[data-notepad-file-name]");
    if (fileNameText) {
      fileNameText.textContent = windowItem.data.fileName;
    }

    const saveAsInput = root.querySelector(`[data-notepad-save-as-input="${windowItem.id}"]`);
    if (saveAsInput && document.activeElement !== saveAsInput && saveAsInput.value !== windowItem.data.saveAsValue) {
      saveAsInput.value = windowItem.data.saveAsValue;
    }

    if (windowItem.data.isSaveAsOpen) {
      window.requestAnimationFrame(() => {
        const input = root.querySelector(`[data-notepad-save-as-input="${windowItem.id}"]`);
        input?.focus();
        input?.select();
      });
    }
  },
  async handleEvent({ type, event, windowItem, windowManager, system }) {
    if (type === "click") {
      const aboutClose = event.target.closest("[data-notepad-about-close]");
      if (aboutClose) {
        windowItem.data.isAboutOpen = false;
        windowManager.syncAppWindow(windowItem.id);
        return true;
      }

      const saveAsCancel = event.target.closest("[data-notepad-save-as-cancel]");
      if (saveAsCancel) {
        closeSaveAsDialog(windowItem);
        windowManager.syncAppWindow(windowItem.id);
        return true;
      }

      const saveAsConfirm = event.target.closest("[data-notepad-save-as-confirm]");
      if (saveAsConfirm) {
        const nextFileName = String(windowItem.data.saveAsValue ?? "").trim();
        if (nextFileName) {
          windowItem.data.fileName = nextFileName;
          closeSaveAsDialog(windowItem);
          return saveNotepadFile(windowItem, windowManager, system, nextFileName);
        }

        closeSaveAsDialog(windowItem);
        windowManager.syncAppWindow(windowItem.id);
        return true;
      }

      const actionButton = event.target.closest("[data-notepad-action]");
      if (actionButton) {
        return handleMenuAction(actionButton.dataset.notepadAction, windowItem, windowManager, system);
      }

      const menuToggle = event.target.closest("[data-notepad-menu-toggle]");
      if (menuToggle) {
        const { notepadMenuToggle } = menuToggle.dataset;
        windowItem.data.activeMenu =
          windowItem.data.activeMenu === notepadMenuToggle ? null : notepadMenuToggle;
        windowManager.syncAppWindow(windowItem.id);
        return true;
      }

      if (
        windowItem.data.activeMenu &&
        event.target.closest("[data-notepad-window]") &&
        !event.target.closest("[data-notepad-menu]") &&
        !event.target.closest("[data-notepad-menu-toggle]")
      ) {
        closeMenus(windowItem);
        windowManager.syncAppWindow(windowItem.id);
      }

      return false;
    }

    if (type === "input") {
      const editor = event.target.closest("[data-notepad-editor]");
      if (editor) {
        windowItem.data.content = editor.value;
        return true;
      }

      const saveAsInput = event.target.closest("[data-notepad-save-as-input]");
      if (saveAsInput) {
        windowItem.data.saveAsValue = saveAsInput.value;
        return true;
      }

      return false;
    }

    if (type === "change") {
      const fileInput = event.target.closest("[data-notepad-file-input]");
      if (!fileInput || !fileInput.files?.[0]) {
        return false;
      }

      const [file] = fileInput.files;
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        windowItem.data.fileName = file.name;
        windowItem.data.content = typeof reader.result === "string" ? reader.result : "";
        windowItem.data.fileRef = null;
        windowManager.syncAppWindow(windowItem.id);
      });
      reader.readAsText(file);
      return true;
    }

    if (type === "mouseover") {
      if (!windowItem.data.activeMenu) {
        return false;
      }

      const menuToggle = event.target.closest("[data-notepad-menu-toggle]");
      if (!menuToggle) {
        return false;
      }

      const { notepadMenuToggle } = menuToggle.dataset;
      if (windowItem.data.activeMenu === notepadMenuToggle) {
        return false;
      }

      windowItem.data.activeMenu = notepadMenuToggle;
      windowManager.syncAppWindow(windowItem.id);
      return true;
    }

    if (type === "keydown") {
      const saveAsInput = event.target.closest("[data-notepad-save-as-input]");
      if (saveAsInput) {
        if (event.key === "Enter") {
          event.preventDefault();
          const nextFileName = String(windowItem.data.saveAsValue ?? "").trim();
          if (nextFileName) {
            windowItem.data.fileName = nextFileName;
            closeSaveAsDialog(windowItem);
            return saveNotepadFile(windowItem, windowManager, system, nextFileName);
          }

          closeSaveAsDialog(windowItem);
          windowManager.syncAppWindow(windowItem.id);
          return true;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          closeSaveAsDialog(windowItem);
          windowManager.syncAppWindow(windowItem.id);
          return true;
        }

        return false;
      }

      const isModifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (isModifier && key === "n") {
        event.preventDefault();
        return handleMenuAction("new", windowItem, windowManager, system);
      }

      if (isModifier && key === "o") {
        event.preventDefault();
        return handleMenuAction("open", windowItem, windowManager, system);
      }

      if (isModifier && key === "s") {
        event.preventDefault();
        return handleMenuAction("save", windowItem, windowManager, system);
      }

      if (event.key === "F5") {
        event.preventDefault();
        return handleMenuAction("time-date", windowItem, windowManager, system);
      }

      return false;
    }

    return false;
  },
};
