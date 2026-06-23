const DOCUMENT_ITEMS = [
  {
    id: "resume",
    title: "Resume.txt",
    type: "Text Document",
    size: "18 KB",
    modified: "06/12/26",
    icon: "./res/png/notepad_file-0.png",
    description: "A concise career snapshot formatted for quick review.",
    preview:
      "Summary\nProduct-minded software engineer building practical web interfaces, reliable tools, and thoughtful systems.\n\nHighlights\n- Frontend application architecture\n- Interactive UI systems\n- Clear technical communication",
    actionLabel: "Open in Notepad",
    appId: "notepad",
  },
  {
    id: "case-studies",
    title: "Case Studies",
    type: "File Folder",
    size: "4 items",
    modified: "06/10/26",
    icon: "./res/png/directory_open_cool-0.png",
    description: "Selected project writeups, implementation notes, and outcomes.",
    preview:
      "Case Studies contains deeper notes on product decisions, engineering tradeoffs, interface details, and delivery context.",
    actionLabel: "Open Portfolio",
    appId: "portfolio",
  },
  {
    id: "project-index",
    title: "Project Index.htm",
    type: "HTML Document",
    size: "32 KB",
    modified: "06/09/26",
    icon: "./res/png/html-0.png",
    description: "A browsable index of featured builds and links.",
    preview:
      "Open this document to review featured projects, live links, and implementation notes in the portfolio browser.",
    actionLabel: "Open Portfolio",
    appId: "portfolio",
  },
  {
    id: "contact-sheet",
    title: "Contact Sheet",
    type: "File Folder",
    size: "3 items",
    modified: "06/04/26",
    icon: "./res/png/message_envelope_open-0.png",
    description: "Contact details and public profile links.",
    preview:
      "Use this folder to find email, GitHub, LinkedIn, and preferred contact details.",
    actionLabel: "Open Contact",
    appId: "contact",
  },
  {
    id: "readme",
    title: "README.txt",
    type: "Text Document",
    size: "6 KB",
    modified: "06/01/26",
    icon: "./res/png/write_file-0.png",
    description: "Short orientation notes for the desktop.",
    preview:
      "Welcome to the Documents folder.\n\nDouble-click items to open their related app. Use Details for metadata and Preview for the document contents.",
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

  windowManager.openWindow(selectedItem.appId);
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
      return true;
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
