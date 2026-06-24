export const DOCUMENT_ITEMS = [
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

const documentTitlesStorageKey = "win95-documents-titles";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function loadDocumentTitles() {
  try {
    const rawTitles = window.localStorage.getItem(documentTitlesStorageKey);
    const titles = rawTitles ? JSON.parse(rawTitles) : {};
    DOCUMENT_ITEMS.forEach((item) => {
      if (typeof titles[item.id] === "string" && titles[item.id].trim()) {
        item.title = titles[item.id].trim();
      }
    });
  } catch {
    // Keep default titles if localStorage is unavailable or malformed.
  }
}

function getDocumentItems(system = null) {
  return Array.isArray(system?.documentItems) ? system.documentItems : DOCUMENT_ITEMS;
}

function saveDocumentTitles(system = null) {
  if (typeof system?.saveFileState === "function") {
    system.saveFileState();
    return;
  }

  const titles = Object.fromEntries(getDocumentItems(system).map((item) => [item.id, item.title]));

  try {
    window.localStorage.setItem(documentTitlesStorageKey, JSON.stringify(titles));
  } catch {
    // Renames still work for the current session if storage quota is unavailable.
  }
}

function getUniqueDocumentTitle(baseTitle, excludedItemId = null, system = null) {
  const normalizedBaseTitle = String(baseTitle ?? "").trim() || "Untitled";
  const existingTitles = new Set(
    getDocumentItems(system)
      .filter((item) => item.id !== excludedItemId)
      .map((item) => item.title.toLocaleLowerCase())
  );

  if (!existingTitles.has(normalizedBaseTitle.toLocaleLowerCase())) {
    return normalizedBaseTitle;
  }

  let index = 2;
  let nextTitle = `${normalizedBaseTitle} (${index})`;

  while (existingTitles.has(nextTitle.toLocaleLowerCase())) {
    index += 1;
    nextTitle = `${normalizedBaseTitle} (${index})`;
  }

  return nextTitle;
}

function closeDocumentsContextMenu(windowItem) {
  windowItem.data.contextMenu = null;
}

function finishDocumentRename(windowItem, itemId, rawTitle, system = null) {
  const item = getDocument(itemId, system);
  if (!item) {
    windowItem.data.renamingItemId = null;
    return;
  }

  item.title = getUniqueDocumentTitle(rawTitle, item.id, system);
  windowItem.data.selectedItemId = item.id;
  windowItem.data.renamingItemId = null;
  saveDocumentTitles(system);
}

loadDocumentTitles();

function getDocument(itemId, system = null) {
  const items = getDocumentItems(system);
  return items.find((item) => item.id === itemId) ?? items[0] ?? null;
}

function getSelectedDocumentIds(windowItem) {
  const selectedIds = Array.isArray(windowItem.data.selectedItemIds) ? windowItem.data.selectedItemIds : [];
  if (selectedIds.length > 0) {
    return selectedIds;
  }

  return windowItem.data.selectedItemId ? [windowItem.data.selectedItemId] : [];
}

function setSelectedDocumentIds(windowItem, selectedIds, primaryItemId = null) {
  const uniqueIds = Array.from(new Set(selectedIds.filter(Boolean)));
  windowItem.data.selectedItemIds = uniqueIds;
  windowItem.data.selectedItemId = primaryItemId ?? uniqueIds[uniqueIds.length - 1] ?? null;
}

function selectDocumentRange(windowItem, targetItemId, system = null) {
  const items = getDocumentItems(system);
  const anchorId = windowItem.data.selectionAnchorItemId ?? windowItem.data.selectedItemId ?? targetItemId;
  const anchorIndex = items.findIndex((item) => item.id === anchorId);
  const targetIndex = items.findIndex((item) => item.id === targetItemId);

  if (anchorIndex < 0 || targetIndex < 0) {
    setSelectedDocumentIds(windowItem, [targetItemId], targetItemId);
    windowItem.data.selectionAnchorItemId = targetItemId;
    return;
  }

  const startIndex = Math.min(anchorIndex, targetIndex);
  const endIndex = Math.max(anchorIndex, targetIndex);
  setSelectedDocumentIds(
    windowItem,
    items.slice(startIndex, endIndex + 1).map((item) => item.id),
    targetItemId
  );
}

function updateDocumentSelection(windowItem, targetItemId, event, system = null) {
  if (event.shiftKey) {
    selectDocumentRange(windowItem, targetItemId, system);
    return;
  }

  if (event.ctrlKey || event.metaKey) {
    const selectedIds = getSelectedDocumentIds(windowItem);
    const isSelected = selectedIds.includes(targetItemId);
    const nextSelectedIds = isSelected
      ? selectedIds.filter((itemId) => itemId !== targetItemId)
      : [...selectedIds, targetItemId];

    setSelectedDocumentIds(windowItem, nextSelectedIds, targetItemId);
    windowItem.data.selectionAnchorItemId = targetItemId;
    return;
  }

  setSelectedDocumentIds(windowItem, [targetItemId], targetItemId);
  windowItem.data.selectionAnchorItemId = targetItemId;
}

function normalizeDocumentSelection(windowItem, system = null) {
  const availableIds = new Set(getDocumentItems(system).map((item) => item.id));
  const selectedIds = getSelectedDocumentIds(windowItem).filter((itemId) => availableIds.has(itemId));

  if (selectedIds.length > 0) {
    const primaryItemId = selectedIds.includes(windowItem.data.selectedItemId)
      ? windowItem.data.selectedItemId
      : selectedIds[0];
    setSelectedDocumentIds(windowItem, selectedIds, primaryItemId);
    return;
  }

  const fallbackItem = getDocumentItems(system)[0] ?? null;
  setSelectedDocumentIds(windowItem, fallbackItem ? [fallbackItem.id] : [], fallbackItem?.id ?? null);
  windowItem.data.selectionAnchorItemId = fallbackItem?.id ?? null;
}

export function getDocumentWallpaperItems(system = null) {
  return getDocumentItems(system).filter((item) => item.paintFile);
}

export function renderPaintFileToDataUrl(paintFile) {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 200;

  const context = canvas.getContext("2d");
  context.imageSmoothingEnabled = false;
  context.fillStyle = paintFile?.background ?? "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  (paintFile?.rects ?? []).forEach(([color, x, y, width, height]) => {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  });

  return canvas.toDataURL("image/png");
}

function renderDocumentRows(selectedItemIds, renamingItemId = null, system = null) {
  const selectedIds = new Set(selectedItemIds);

  return getDocumentItems(system).map((item) => {
    const isSelected = selectedIds.has(item.id);
    const isRenaming = item.id === renamingItemId;
    const titleMarkup = isRenaming
      ? `
        <input
          class="documents-app__rename-input"
          type="text"
          value="${escapeHtml(item.title)}"
          data-documents-rename-input="${item.id}"
          aria-label="Document name"
        >
      `
      : `<span>${escapeHtml(item.title)}</span>`;

    return `
      <div
        class="documents-app__row ${isSelected ? "documents-app__row--selected" : ""}"
        role="button"
        tabindex="0"
        data-documents-item="${item.id}"
        aria-pressed="${String(isSelected)}"
      >
        <span class="documents-app__cell documents-app__cell--name">
          <img class="documents-app__item-icon" src="${item.icon}" alt="" width="18" height="18">
          ${titleMarkup}
        </span>
        <span class="documents-app__cell documents-app__cell--type">${escapeHtml(item.type)}</span>
        <span class="documents-app__cell documents-app__cell--modified">${escapeHtml(item.modified)}</span>
        <span class="documents-app__cell documents-app__cell--size">${escapeHtml(item.size)}</span>
      </div>
    `;
  }).join("");
}

function renderDocumentsContextMenu(windowItem) {
  const contextMenu = windowItem.data.contextMenu;
  if (!contextMenu) {
    return "";
  }

  return `
    <div
      class="documents-app__context-menu context-menu"
      style="left: ${contextMenu.x}px; top: ${contextMenu.y}px;"
      data-documents-context-menu
    >
      <button class="context-menu__item" type="button" data-documents-context-action="open">Open</button>
      <button class="context-menu__item" type="button" data-documents-context-action="rename">Rename</button>
    </div>
  `;
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

function openSelectedDocument(windowItem, windowManager, system = null) {
  const selectedItem = getDocument(windowItem.data.selectedItemId, system);

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
    const initialSelectedId = DOCUMENT_ITEMS[0]?.id ?? null;

    return {
      selectedItemId: initialSelectedId,
      selectedItemIds: initialSelectedId ? [initialSelectedId] : [],
      selectionAnchorItemId: initialSelectedId,
      viewMode: "preview",
      renamingItemId: null,
      contextMenu: null,
    };
  },
  render(windowItem, system) {
    normalizeDocumentSelection(windowItem, system);
    const items = getDocumentItems(system);
    const selectedItem = getDocument(windowItem.data.selectedItemId, system);
    const selectedIds = getSelectedDocumentIds(windowItem);
    const isPreview = windowItem.data.viewMode !== "details";
    const selectedTitle = selectedItem?.title ?? "My Documents";
    const selectedCount = selectedIds.length;

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
          <span class="documents-app__address-value">C:\\My Documents\\${escapeHtml(selectedTitle)}</span>
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
              ${renderDocumentRows(selectedIds, windowItem.data.renamingItemId, system)}
            </div>
          </section>
          <aside class="documents-app__preview" data-documents-preview aria-label="Document preview">
            ${selectedItem ? renderPreview(selectedItem) : ""}
          </aside>
        </div>
        <div class="documents-app__status" data-documents-status>
          ${items.length} object${items.length === 1 ? "" : "s"}; ${selectedCount} selected${selectedCount === 1 ? `: ${escapeHtml(selectedTitle)}` : ""}
        </div>
        ${renderDocumentsContextMenu(windowItem)}
      </div>
    `;
  },
  sync(element, windowItem, windowManager, system) {
    const root = element.querySelector(`[data-documents-window="${windowItem.id}"]`);
    if (!root) {
      return;
    }

    normalizeDocumentSelection(windowItem, system);
    const items = getDocumentItems(system);
    const selectedItem = getDocument(windowItem.data.selectedItemId, system);
    if (!selectedItem) {
      return;
    }
    const selectedIds = getSelectedDocumentIds(windowItem);
    const isPreview = windowItem.data.viewMode !== "details";
    const list = root.querySelector("[data-documents-list]");
    if (list) {
      list.innerHTML = renderDocumentRows(selectedIds, windowItem.data.renamingItemId, system);
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
      status.textContent =
        `${items.length} objects; ${selectedIds.length} selected` +
        (selectedIds.length === 1 ? `: ${selectedItem.title}` : "");
    }

    root.querySelector("[data-documents-context-menu]")?.remove();
    root.insertAdjacentHTML("beforeend", renderDocumentsContextMenu(windowItem));

    if (windowItem.data.renamingItemId) {
      window.requestAnimationFrame(() => {
        const input = root.querySelector(
          `[data-documents-rename-input="${windowItem.data.renamingItemId}"]`
        );
        input?.focus();
        input?.select();
      });
    }
  },
  handleEvent({ type, event, windowItem, windowManager, system }) {
    if (type === "mousedown") {
      if (event.button !== 0 || event.target.closest("[data-documents-rename-input]")) {
        return false;
      }

      const itemRow = event.target.closest("[data-documents-item]");
      if (!itemRow || typeof system?.startDocumentDrag !== "function") {
        return false;
      }

      closeDocumentsContextMenu(windowItem);
      if (!getSelectedDocumentIds(windowItem).includes(itemRow.dataset.documentsItem)) {
        updateDocumentSelection(windowItem, itemRow.dataset.documentsItem, event, system);
      }
      system.startDocumentDrag(getSelectedDocumentIds(windowItem), event);
      windowManager.syncAppWindow(windowItem.id);
      return true;
    }

    if (type === "contextmenu") {
      const itemRow = event.target.closest("[data-documents-item]");
      if (!itemRow) {
        event.preventDefault();
        closeDocumentsContextMenu(windowItem);
        windowManager.syncAppWindow(windowItem.id);
        return true;
      }

      event.preventDefault();
      const root = event.target.closest(`[data-documents-window="${windowItem.id}"]`);
      const rootRect = root.getBoundingClientRect();
      if (!getSelectedDocumentIds(windowItem).includes(itemRow.dataset.documentsItem)) {
        setSelectedDocumentIds(windowItem, [itemRow.dataset.documentsItem], itemRow.dataset.documentsItem);
        windowItem.data.selectionAnchorItemId = itemRow.dataset.documentsItem;
      }
      windowItem.data.contextMenu = {
        itemId: itemRow.dataset.documentsItem,
        x: Math.max(4, event.clientX - rootRect.left),
        y: Math.max(4, event.clientY - rootRect.top),
      };
      windowManager.syncAppWindow(windowItem.id);
      return true;
    }

    if (type === "click") {
      if (typeof system?.consumeDocumentDragSuppression === "function" && system.consumeDocumentDragSuppression()) {
        return true;
      }

      const contextAction = event.target.closest("[data-documents-context-action]");
      if (contextAction) {
        const contextItemId = windowItem.data.contextMenu?.itemId;
        if (contextItemId && !getSelectedDocumentIds(windowItem).includes(contextItemId)) {
          setSelectedDocumentIds(windowItem, [contextItemId], contextItemId);
        }

        if (contextAction.dataset.documentsContextAction === "open") {
          closeDocumentsContextMenu(windowItem);
          windowManager.syncAppWindow(windowItem.id);
          return openSelectedDocument(windowItem, windowManager, system);
        }

        if (contextAction.dataset.documentsContextAction === "rename") {
          windowItem.data.renamingItemId = windowItem.data.selectedItemId;
          closeDocumentsContextMenu(windowItem);
          windowManager.syncAppWindow(windowItem.id);
          return true;
        }
      }

      if (event.target.closest("[data-documents-rename-input]")) {
        return true;
      }

      closeDocumentsContextMenu(windowItem);

      const actionButton = event.target.closest("[data-documents-action]");
      if (actionButton) {
        if (actionButton.dataset.documentsAction === "open") {
          openSelectedDocument(windowItem, windowManager, system);
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

      updateDocumentSelection(windowItem, itemButton.dataset.documentsItem, event, system);
      windowManager.syncAppWindow(windowItem.id);
      return true;
    }

    if (type === "dblclick") {
      if (event.target.closest("[data-documents-rename-input]")) {
        return true;
      }

      const itemButton = event.target.closest("[data-documents-item]");
      if (!itemButton) {
        return false;
      }

      setSelectedDocumentIds(windowItem, [itemButton.dataset.documentsItem], itemButton.dataset.documentsItem);
      windowItem.data.selectionAnchorItemId = itemButton.dataset.documentsItem;
      openSelectedDocument(windowItem, windowManager, system);
      return true;
    }

    if (type === "keydown") {
      const renameInput = event.target.closest("[data-documents-rename-input]");
      if (renameInput) {
        if (event.key === "Enter") {
          event.preventDefault();
          finishDocumentRename(windowItem, renameInput.dataset.documentsRenameInput, renameInput.value, system);
          windowManager.syncAppWindow(windowItem.id);
        }

        if (event.key === "Escape") {
          event.preventDefault();
          windowItem.data.renamingItemId = null;
          windowManager.syncAppWindow(windowItem.id);
        }

        return true;
      }

      if (event.key !== "Enter") {
        return false;
      }

      event.preventDefault();
      return openSelectedDocument(windowItem, windowManager, system);
    }

    if (type === "focusout") {
      const renameInput = event.target.closest("[data-documents-rename-input]");
      if (!renameInput || windowItem.data.renamingItemId !== renameInput.dataset.documentsRenameInput) {
        return false;
      }

      finishDocumentRename(windowItem, renameInput.dataset.documentsRenameInput, renameInput.value, system);
      windowManager.syncAppWindow(windowItem.id);
      return true;
    }

    return false;
  },
};
