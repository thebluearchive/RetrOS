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
};
