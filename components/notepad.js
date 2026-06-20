export const notepadApp = {
  id: "notepad",
  title: "Notepad",
  icon: "./res/png/notepad-0.png",
  defaultSize: {
    width: 520,
    height: 360,
  },
  minSize: {
    width: 320,
    height: 240,
  },
  defaultPosition: {
    x: 140,
    y: 72,
  },
  createState() {
    return {
      content: "Welcome to Notepad.\n\nUse this window for notes, drafts, or quick portfolio copy.",
    };
  },
  render(windowItem) {
    return `
      <div class="notepad-app" data-notepad-window="${windowItem.id}">
        <div class="notepad-app__menu" role="menubar" aria-label="Notepad menu">
          <button class="notepad-app__menu-item" type="button" role="menuitem">File</button>
          <button class="notepad-app__menu-item" type="button" role="menuitem">Edit</button>
          <button class="notepad-app__menu-item" type="button" role="menuitem">Help</button>
        </div>
        <textarea
          class="notepad-app__editor"
          data-notepad-editor="${windowItem.id}"
          spellcheck="false"
        >${windowItem.data.content}</textarea>
      </div>
    `;
  },
  sync(element, windowItem) {
    const editor = element.querySelector(`[data-notepad-editor="${windowItem.id}"]`);
    if (!editor) {
      return;
    }

    if (document.activeElement !== editor && editor.value !== windowItem.data.content) {
      editor.value = windowItem.data.content;
    }
  },
  handleEvent({ type, event, windowItem }) {
    if (type !== "input") {
      return false;
    }

    const editor = event.target.closest("[data-notepad-editor]");
    if (!editor) {
      return false;
    }

    windowItem.data.content = editor.value;
    return true;
  },
};
