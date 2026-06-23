const DOCUMENT_ITEMS = [
  {
    id: "moon-note",
    title: "moon-note.txt",
    type: "Text Document",
    size: "2 KB",
    modified: "06/22/26",
    icon: "./res/png/notepad_file-0.png",
    description: "A small note found beside the taskbar clock.",
    content:
      "Moon Note\n\nPlease remember to wind the desktop at midnight.\n\nIf the stars begin blinking in Morse code, do not panic. That usually means the screensaver is dreaming.\n\n- The Night Shift",
    preview:
      "Moon Note\n\nPlease remember to wind the desktop at midnight.\n\nIf the stars begin blinking in Morse code, do not panic...",
    actionLabel: "Open in Notepad",
    appId: "notepad",
  },
  {
    id: "sandwich-memo",
    title: "sandwich-memo.txt",
    type: "Text Document",
    size: "1 KB",
    modified: "06/21/26",
    icon: "./res/png/write_file-0.png",
    description: "A memo with strong opinions about lunch architecture.",
    content:
      "Sandwich Memo\n\nA sandwich is a protocol, not a format.\n\nApproved fillings:\n- Tomato\n- Sharp cheddar\n- One heroic pickle\n\nRejected fillings:\n- Printer toner\n- Loose pixels\n\nPlease file all crumbs under C:\\SNACKS.",
    preview:
      "Sandwich Memo\n\nA sandwich is a protocol, not a format.\n\nApproved fillings:\n- Tomato\n- Sharp cheddar...",
    actionLabel: "Open in Notepad",
    appId: "notepad",
  },
  {
    id: "tiny-castle",
    title: "tiny-castle.bmp",
    type: "Bitmap Image",
    size: "4 KB",
    modified: "06/20/26",
    icon: "./res/png/paint_file-0.png",
    description: "A very small castle with very serious battlements.",
    preview:
      "Bitmap image: tiny-castle.bmp\n\nOpen this file in Paint to inspect the tiny castle.",
    actionLabel: "Open in Paint",
    appId: "paint",
    paintFile: {
      id: "tiny-castle",
      background: "#7ec0ee",
      rects: [
        ["#6bbf59", 0, 164, 320, 36],
        ["#f7d77a", 120, 86, 80, 78],
        ["#c9a34d", 112, 78, 24, 24],
        ["#c9a34d", 148, 70, 24, 32],
        ["#c9a34d", 184, 78, 24, 24],
        ["#8b6f35", 150, 126, 20, 38],
        ["#4a4a4a", 128, 104, 12, 12],
        ["#4a4a4a", 180, 104, 12, 12],
        ["#ffffff", 42, 34, 38, 12],
        ["#ffffff", 236, 48, 46, 12],
        ["#ffff00", 270, 22, 28, 28],
      ],
    },
  },
  {
    id: "desktop-fish",
    title: "desktop-fish.bmp",
    type: "Bitmap Image",
    size: "3 KB",
    modified: "06/19/26",
    icon: "./res/png/paint_file-0.png",
    description: "A fish that appears to be swimming through the desktop.",
    preview:
      "Bitmap image: desktop-fish.bmp\n\nOpen this file in Paint to view the desktop fish.",
    actionLabel: "Open in Paint",
    appId: "paint",
    paintFile: {
      id: "desktop-fish",
      background: "#008080",
      rects: [
        ["#00ffff", 64, 82, 148, 56],
        ["#00a0a0", 92, 138, 82, 18],
        ["#ff8c00", 212, 96, 44, 28],
        ["#ff8c00", 212, 118, 44, 28],
        ["#ffffff", 88, 94, 18, 18],
        ["#000000", 96, 100, 8, 8],
        ["#004f4f", 126, 90, 12, 42],
        ["#004f4f", 154, 90, 12, 42],
        ["#004f4f", 182, 94, 10, 34],
        ["#ffffff", 36, 42, 28, 12],
        ["#ffffff", 248, 56, 34, 12],
      ],
    },
  },
  {
    id: "readme",
    title: "read-me-first.txt",
    type: "Text Document",
    size: "1 KB",
    modified: "06/18/26",
    icon: "./res/png/notepad_file-0.png",
    description: "An oddly polite note from the Documents folder.",
    content:
      "Hello!\n\nThese are not important business documents.\n\nThey are tiny souvenirs from a pretend computer: notes, doodles, and fragments of a desktop that has been left on for too long.\n\nDouble-click a .txt file for Notepad.\nDouble-click a .bmp file for Paint.",
    preview:
      "Hello!\n\nThese are not important business documents.\n\nThey are tiny souvenirs from a pretend computer...",
    actionLabel: "Open in Notepad",
    appId: "notepad",
  },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getDocument(itemId) {
  return DOCUMENT_ITEMS.find((item) => item.id === itemId) ?? DOCUMENT_ITEMS[0];
}

function renderDocumentRows(selectedItemId) {
  return DOCUMENT_ITEMS.map((item) => {
    const isSelected = item.id === selectedItemId;

    return `
      <button
        class="documents-app__row ${isSelected ? "documents-app__row--selected" : ""}"
        type="button"
        data-documents-item="${item.id}"
        aria-pressed="${String(isSelected)}"
      >
        <span class="documents-app__cell documents-app__cell--name">
          <img class="documents-app__item-icon" src="${item.icon}" alt="" width="18" height="18">
          <span>${escapeHtml(item.title)}</span>
        </span>
        <span class="documents-app__cell documents-app__cell--type">${escapeHtml(item.type)}</span>
        <span class="documents-app__cell documents-app__cell--modified">${escapeHtml(item.modified)}</span>
        <span class="documents-app__cell documents-app__cell--size">${escapeHtml(item.size)}</span>
      </button>
    `;
  }).join("");
}

function renderPreview(item) {
  return `
    <div class="documents-app__preview-heading">
      <img class="documents-app__preview-icon" src="${item.icon}" alt="" width="32" height="32">
      <div class="documents-app__preview-title-group">
        <h2 class="documents-app__preview-title">${escapeHtml(item.title)}</h2>
        <span class="documents-app__preview-subtitle">${escapeHtml(item.type)} - ${escapeHtml(item.size)}</span>
      </div>
    </div>
    <p class="documents-app__description">${escapeHtml(item.description)}</p>
    <pre class="documents-app__preview-text">${escapeHtml(item.preview)}</pre>
  `;
}

function openSelectedDocument(windowItem, windowManager) {
  const selectedItem = getDocument(windowItem.data.selectedItemId);

  if (!selectedItem?.appId || !windowManager.hasApp(selectedItem.appId)) {
    return false;
  }

  windowManager.openWindow(selectedItem.appId, {
    fileName: selectedItem.title,
    content: selectedItem.content,
    paintFile: selectedItem.paintFile,
  });
  return true;
}

export const documentsApp = {
  id: "documents",
  title: "Documents",
  icon: "./res/png/directory_open_file_mydocs_small-0.png",
  defaultSize: {
    width: 690,
    height: 448,
  },
  minSize: {
    width: 504,
    height: 328,
  },
  defaultPosition: {
    x: 139,
    y: 101,
  },
  createState() {
    return {
      selectedItemId: DOCUMENT_ITEMS[0].id,
      viewMode: "preview",
    };
  },
  render(windowItem) {
    const selectedItem = getDocument(windowItem.data.selectedItemId);
    const isPreview = windowItem.data.viewMode !== "details";

    return `
      <div class="documents-app" data-documents-window="${windowItem.id}">
        <div class="documents-app__toolbar">
          <button class="win95-button documents-app__toolbar-button" type="button" data-documents-action="open">
            <img class="documents-app__toolbar-icon" src="./res/png/directory_open_cool-0.png" alt="" width="18" height="18">
            <span>Open</span>
          </button>
          <button
            class="win95-button documents-app__toolbar-button"
            type="button"
            data-documents-action="toggle-view"
            aria-pressed="${String(!isPreview)}"
          >
            <img class="documents-app__toolbar-icon" src="./res/png/search_file-0.png" alt="" width="18" height="18">
            <span>${isPreview ? "Details" : "Preview"}</span>
          </button>
        </div>
        <div class="documents-app__address">
          <span class="documents-app__address-label">Address</span>
          <span class="documents-app__address-value">C:\\My Documents\\${escapeHtml(selectedItem.title)}</span>
        </div>
        <div class="documents-app__content ${isPreview ? "" : "documents-app__content--details"}">
          <section class="documents-app__browser" aria-label="Documents list">
            <div class="documents-app__header" aria-hidden="true">
              <span class="documents-app__cell documents-app__cell--name">Name</span>
              <span class="documents-app__cell documents-app__cell--type">Type</span>
              <span class="documents-app__cell documents-app__cell--modified">Modified</span>
              <span class="documents-app__cell documents-app__cell--size">Size</span>
            </div>
            <div class="documents-app__list" data-documents-list>
              ${renderDocumentRows(windowItem.data.selectedItemId)}
            </div>
          </section>
          <aside class="documents-app__preview" data-documents-preview aria-label="Document preview">
            ${renderPreview(selectedItem)}
          </aside>
        </div>
        <div class="documents-app__status" data-documents-status>
          ${DOCUMENT_ITEMS.length} object${DOCUMENT_ITEMS.length === 1 ? "" : "s"} selected: ${escapeHtml(selectedItem.title)}
        </div>
      </div>
    `;
  },
  sync(element, windowItem) {
    const root = element.querySelector(`[data-documents-window="${windowItem.id}"]`);
    if (!root) {
      return;
    }

    const selectedItem = getDocument(windowItem.data.selectedItemId);
    const isPreview = windowItem.data.viewMode !== "details";
    const list = root.querySelector("[data-documents-list]");
    if (list) {
      list.innerHTML = renderDocumentRows(selectedItem.id);
    }

    const preview = root.querySelector("[data-documents-preview]");
    if (preview) {
      preview.innerHTML = renderPreview(selectedItem);
    }

    const content = root.querySelector(".documents-app__content");
    if (content) {
      content.classList.toggle("documents-app__content--details", !isPreview);
    }

    const address = root.querySelector(".documents-app__address-value");
    if (address) {
      address.textContent = `C:\\My Documents\\${selectedItem.title}`;
    }

    const toggleButton = root.querySelector('[data-documents-action="toggle-view"]');
    if (toggleButton) {
      toggleButton.setAttribute("aria-pressed", String(!isPreview));
      const label = toggleButton.querySelector("span");
      if (label) {
        label.textContent = isPreview ? "Details" : "Preview";
      }
    }

    const status = root.querySelector("[data-documents-status]");
    if (status) {
      status.textContent = `${DOCUMENT_ITEMS.length} objects selected: ${selectedItem.title}`;
    }
  },
  handleEvent({ type, event, windowItem, windowManager }) {
    if (type === "click") {
      const actionButton = event.target.closest("[data-documents-action]");
      if (actionButton) {
        if (actionButton.dataset.documentsAction === "open") {
          openSelectedDocument(windowItem, windowManager);
          return true;
        }

        if (actionButton.dataset.documentsAction === "toggle-view") {
          windowItem.data.viewMode = windowItem.data.viewMode === "details" ? "preview" : "details";
          windowManager.syncAppWindow(windowItem.id);
          return true;
        }
      }

      const itemButton = event.target.closest("[data-documents-item]");
      if (!itemButton) {
        return false;
      }

      windowItem.data.selectedItemId = itemButton.dataset.documentsItem;
      windowManager.syncAppWindow(windowItem.id);
      return openSelectedDocument(windowItem, windowManager);
    }

    if (type === "dblclick") {
      const itemButton = event.target.closest("[data-documents-item]");
      if (!itemButton) {
        return false;
      }

      windowItem.data.selectedItemId = itemButton.dataset.documentsItem;
      openSelectedDocument(windowItem, windowManager);
      return true;
    }

    if (type === "keydown") {
      if (event.key !== "Enter") {
        return false;
      }

      event.preventDefault();
      return openSelectedDocument(windowItem, windowManager);
    }

    return false;
  },
};
