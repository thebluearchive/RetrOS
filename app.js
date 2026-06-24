import { apps } from "./apps.js";
import { DOCUMENT_ITEMS } from "./components/documents.js";
import { WindowManager } from "./windows.js";

const clockElement = document.getElementById("clock");
const desktopElement = document.querySelector(".desktop");
const windowLayerElement = document.getElementById("window-layer");
const taskbarAppsElement = document.getElementById("taskbar-apps");
const startButton = document.getElementById("start-button");
const startMenu = document.getElementById("start-menu");
const desktopIconsElement = document.querySelector(".desktop-icons");
const desktopContextMenuElement = document.getElementById("desktop-context-menu");
const shutdownScreenElement = document.getElementById("shutdown-screen");
const shutdownSequenceDuration = 2000;
const desktopBackgroundStorageKey = "win95-desktop-background";
const desktopFilesStorageKey = "win95-desktop-files";
const recycleBinEmptyIcon = "./res/png/recycle_bin_empty-0.png";
const recycleBinFullIcon = "./res/png/recycle_bin_full-0.png";
const desktopGrid = {
  startX: 12,
  startY: 14,
  stepX: 108,
  stepY: 98,
  iconWidth: 100,
  iconHeight: 86,
};
let shutdownTimeoutIds = [];
const desktopSelectionElement = document.createElement("div");
const documentDragProxyElement = document.createElement("div");
const desktopDragProxyElement = document.createElement("div");
let desktopSelectionState = null;
let desktopDragState = null;
let desktopContextMenuState = {
  type: "desktop",
  itemId: null,
  clientX: 0,
  clientY: 0,
};
let suppressDesktopIconClick = false;
let renamingDesktopItemId = null;
let documentDragState = null;

const initialDesktopItems = [
  {
    id: "recycle-bin",
    appId: "recycle-bin",
    title: "Recycle Bin",
    icon: recycleBinEmptyIcon,
    order: 0,
    isProtected: true,
  },
  {
    id: "my-computer",
    appId: "my-computer",
    title: "My Computer",
    icon: "./res/png/computer_explorer-0.png",
    order: 1,
  },
  {
    id: "documents",
    appId: "documents",
    title: "Documents",
    icon: "./res/png/directory_open_file_mydocs_small-0.png",
    order: 2,
  },
  {
    id: "notepad",
    appId: "notepad",
    title: "Notepad",
    icon: "./res/png/notepad-0.png",
    order: 3,
  },
  {
    id: "browser",
    appId: "browser",
    title: "Internet Explorer",
    icon: "./res/png/msie1-0.png",
    order: 4,
  },
  {
    id: "paint",
    appId: "paint",
    title: "Paint",
    icon: "./res/png/paint_file-0.png",
    order: 5,
  },
  {
    id: "virtual-machine",
    appId: "virtual-machine",
    title: "Virtual Machine",
    icon: "./res/png/computer_2-0.png",
    order: 6,
  },
];

const system = {
  desktopItems: initialDesktopItems.map((item) => ({ ...item })),
  documentItems: DOCUMENT_ITEMS.map((item) => ({ ...item })),
  recycleBinItems: [],
  desktopBackground: loadDesktopBackground(),
  nextDesktopFileId: 1,
  shouldSuppressDocumentClick: false,
  loadDesktopFiles() {
    const state = loadDesktopFilesState();
    this.desktopItems = [
      ...initialDesktopItems.map((item) => ({ ...item })),
      ...state.desktopItems,
    ];
    this.documentItems = state.documentItems;
    this.recycleBinItems = state.recycleBinItems;
    this.nextDesktopFileId = state.nextDesktopFileId;
  },
  initializeDesktopItems() {
    this.desktopItems = this.desktopItems.map((item) => {
      if (Number.isInteger(item.gridColumn) && Number.isInteger(item.gridRow)) {
        return item;
      }

      return {
        ...item,
        ...getDefaultDesktopSlot(item.order),
      };
    });
  },
  getRecycleBinIcon() {
    return this.recycleBinItems.length > 0 ? recycleBinFullIcon : recycleBinEmptyIcon;
  },
  getDesktopItem(itemId) {
    return this.desktopItems.find((item) => item.id === itemId) ?? null;
  },
  getDesktopItemBySlot(gridColumn, gridRow, excludedItemId = null) {
    return (
      this.desktopItems.find((item) => {
        return (
          item.id !== excludedItemId &&
          item.gridColumn === gridColumn &&
          item.gridRow === gridRow
        );
      }) ?? null
    );
  },
  moveDesktopItem(itemId, targetSlot) {
    return this.moveDesktopItems([itemId], itemId, targetSlot);
  },
  moveDesktopItems(itemIds, primaryItemId, targetSlot) {
    const ids = new Set(itemIds);
    const primaryItem = this.getDesktopItem(primaryItemId);
    if (!primaryItem) {
      return false;
    }

    const nextSlot = getNearestDesktopSlot(targetSlot.left, targetSlot.top);
    const deltaColumn = nextSlot.gridColumn - primaryItem.gridColumn;
    const deltaRow = nextSlot.gridRow - primaryItem.gridRow;
    const nextSlots = this.desktopItems
      .filter((item) => ids.has(item.id))
      .map((item) => {
        return {
          item,
          gridColumn: item.gridColumn + deltaColumn,
          gridRow: item.gridRow + deltaRow,
        };
      });

    const { columns, rows } = getDesktopGridLimits();
    const hasInvalidSlot = nextSlots.some(({ gridColumn, gridRow }) => {
      return gridColumn < 0 || gridColumn >= columns || gridRow < 0 || gridRow >= rows;
    });

    const hasCollision = nextSlots.some(({ gridColumn, gridRow }) => {
      const occupiedItem = this.getDesktopItemBySlot(gridColumn, gridRow);
      return occupiedItem && !ids.has(occupiedItem.id);
    });

    if (hasInvalidSlot || hasCollision) {
      renderDesktopIcons();
      return false;
    }

    nextSlots.forEach(({ item, gridColumn, gridRow }) => {
      item.gridColumn = gridColumn;
      item.gridRow = gridRow;
    });

    saveDesktopFilesState();
    renderDesktopIcons();
    return true;
  },
  getNextAvailableDesktopSlot(preferredSlot = null, excludedItemId = null) {
    const { columns, rows } = getDesktopGridLimits();
    const occupiedSlots = new Set(
      this.desktopItems
        .filter((item) => item.id !== excludedItemId)
        .map((item) => `${item.gridColumn}:${item.gridRow}`)
    );

    if (preferredSlot) {
      const normalizedPreferredSlot = normalizeDesktopSlot(preferredSlot);
      const preferredKey = `${normalizedPreferredSlot.gridColumn}:${normalizedPreferredSlot.gridRow}`;
      if (!occupiedSlots.has(preferredKey)) {
        return normalizedPreferredSlot;
      }
    }

    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        const key = `${column}:${row}`;
        if (!occupiedSlots.has(key)) {
          return { gridColumn: column, gridRow: row };
        }
      }
    }

    return preferredSlot ? normalizeDesktopSlot(preferredSlot) : { gridColumn: 0, gridRow: 0 };
  },
  deleteDesktopItems(itemIds) {
    const ids = new Set(itemIds);
    const removedItems = [];

    this.desktopItems = this.desktopItems.filter((item) => {
      if (!ids.has(item.id) || item.isProtected) {
        return true;
      }

      removedItems.push({
        ...item,
        deletedAt: Date.now(),
      });
      return false;
    });

    if (removedItems.length === 0) {
      return;
    }

    this.recycleBinItems = [...removedItems, ...this.recycleBinItems];
    saveDesktopFilesState();
    renderDesktopIcons();
    windowManager.syncWindowsByAppId("recycle-bin");
  },
  restoreRecycleBinItems(itemIds) {
    const ids = new Set(itemIds);
    const restoredItems = [];

    this.recycleBinItems = this.recycleBinItems.filter((item) => {
      if (!ids.has(item.id)) {
        return true;
      }

      const { deletedAt, ...desktopItem } = item;
      restoredItems.push(desktopItem);
      return false;
    });

    if (restoredItems.length === 0) {
      return;
    }

    restoredItems.forEach((item) => {
      const nextSlot = this.getNextAvailableDesktopSlot(
        {
          gridColumn: item.gridColumn,
          gridRow: item.gridRow,
        },
        item.id
      );

      item.gridColumn = nextSlot.gridColumn;
      item.gridRow = nextSlot.gridRow;
    });

    this.desktopItems = [...this.desktopItems, ...restoredItems].sort((left, right) => left.order - right.order);
    saveDesktopFilesState();
    renderDesktopIcons();
    windowManager.syncWindowsByAppId("recycle-bin");
  },
  emptyRecycleBin() {
    if (this.recycleBinItems.length === 0) {
      return;
    }

    this.recycleBinItems = [];
    saveDesktopFilesState();
    renderDesktopIcons();
    windowManager.syncWindowsByAppId("recycle-bin");
  },
  setDesktopBackground(background) {
    this.desktopBackground = normalizeDesktopBackground(background);
    saveDesktopBackground(this.desktopBackground);
    applyDesktopBackground(this.desktopBackground);
  },
  saveFileState() {
    saveDesktopFilesState();
  },
  startDocumentDrag(documentIds, event) {
    documentDragState = {
      documentIds: Array.isArray(documentIds) ? documentIds : [documentIds],
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      currentPointerX: event.clientX,
      currentPointerY: event.clientY,
      didMove: false,
    };
  },
  consumeDocumentDragSuppression() {
    if (!this.shouldSuppressDocumentClick) {
      return false;
    }

    this.shouldSuppressDocumentClick = false;
    return true;
  },
  createDesktopFile(fileType, preferredSlot = null) {
    const fileDefinition = getDesktopFileDefinition(fileType);
    if (!fileDefinition) {
      return null;
    }

    const item = {
      id: `desktop-file-${this.nextDesktopFileId}`,
      appId: fileDefinition.appId,
      title: getUniqueDesktopTitle("Untitled"),
      icon: fileDefinition.icon,
      order: getNextDesktopItemOrder(),
      fileType,
      content: fileDefinition.content,
      paintFile: fileDefinition.paintFile,
      ...this.getNextAvailableDesktopSlot(preferredSlot),
    };

    this.nextDesktopFileId += 1;
    this.desktopItems.push(item);
    renamingDesktopItemId = item.id;
    saveDesktopFilesState();
    renderDesktopIcons();
    return item;
  },
  getDocumentItem(itemId) {
    return this.documentItems.find((item) => item.id === itemId) ?? null;
  },
  moveDocumentToDesktop(documentId, preferredSlot = null) {
    const documentItem = this.getDocumentItem(documentId);
    if (!documentItem) {
      return null;
    }

    this.documentItems = this.documentItems.filter((item) => item.id !== documentId);
    const item = {
      id: `desktop-document-${documentItem.id}`,
      appId: documentItem.appId,
      title: getUniqueDesktopTitle(documentItem.title),
      icon: documentItem.icon,
      order: getNextDesktopItemOrder(),
      documentId: documentItem.id,
      fileType: documentItem.paintFile ? "paint" : "note",
      content: documentItem.content,
      paintFile: documentItem.paintFile,
      documentItem,
      ...this.getNextAvailableDesktopSlot(preferredSlot),
    };

    this.desktopItems.push(item);
    saveDesktopFilesState();
    renderDesktopIcons();
    windowManager.syncWindowsByAppId("documents");
    return item;
  },
  moveDocumentsToDesktop(documentIds, preferredSlot = null) {
    let nextSlot = preferredSlot;
    const movedItems = [];

    documentIds.forEach((documentId) => {
      const item = this.moveDocumentToDesktop(documentId, nextSlot);
      if (!item) {
        return;
      }

      movedItems.push(item);
      nextSlot = this.getNextAvailableDesktopSlot({
        gridColumn: item.gridColumn,
        gridRow: item.gridRow + 1,
      });
    });

    return movedItems;
  },
  moveDesktopFileToDocuments(itemId) {
    const item = this.getDesktopItem(itemId);
    if (!item || item.isProtected || !item.appId || !["notepad", "paint"].includes(item.appId)) {
      return false;
    }

    this.desktopItems = this.desktopItems.filter((desktopItem) => desktopItem.id !== itemId);
    const documentItem = item.documentItem
      ? { ...item.documentItem, title: item.title }
      : {
          id: item.documentId ?? `document-${item.id}`,
          title: item.title,
          type: item.appId === "paint" ? "Bitmap Image" : "Text Document",
          size: "1 KB",
          modified: new Date().toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "2-digit",
          }),
          icon: item.icon,
          description: item.appId === "paint" ? "A paint document moved from the desktop." : "A note moved from the desktop.",
          content: item.content ?? "",
          preview: item.appId === "paint" ? "Bitmap image" : (item.content || "Empty note"),
          actionLabel: item.appId === "paint" ? "Open in Paint" : "Open in Notepad",
          appId: item.appId,
          paintFile: item.paintFile ?? null,
        };

    documentItem.title = getUniqueDocumentSystemTitle(documentItem.title, documentItem.id);
    this.documentItems = [...this.documentItems, documentItem];
    saveDesktopFilesState();
    renderDesktopIcons();
    windowManager.syncWindowsByAppId("documents");
    return true;
  },
};

desktopSelectionElement.className = "desktop-selection desktop-selection--hidden";
desktopSelectionElement.setAttribute("aria-hidden", "true");
desktopElement.insertBefore(desktopSelectionElement, windowLayerElement);

documentDragProxyElement.className = "document-drag-proxy document-drag-proxy--hidden";
documentDragProxyElement.setAttribute("aria-hidden", "true");
desktopElement.appendChild(documentDragProxyElement);

desktopDragProxyElement.className = "desktop-drag-proxy desktop-drag-proxy--hidden";
desktopDragProxyElement.setAttribute("aria-hidden", "true");
desktopElement.appendChild(desktopDragProxyElement);

const windowManager = new WindowManager({
  apps,
  desktop: desktopElement,
  windowLayer: windowLayerElement,
  taskbarApps: taskbarAppsElement,
  system,
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateClock() {
  const now = new Date();
  clockElement.textContent = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeDesktopBackground(background) {
  const color =
    typeof background?.color === "string" && /^#[0-9a-f]{6}$/i.test(background.color)
      ? background.color
      : "#008080";

  if (background?.type === "document-image" || background?.type === "uploaded-image") {
    return {
      type: background.type,
      color,
      image: typeof background.image === "string" ? background.image : null,
      sourceId: typeof background.sourceId === "string" ? background.sourceId : null,
      sourceName: typeof background.sourceName === "string" ? background.sourceName : "Image",
    };
  }

  return {
    type: "color",
    color,
    image: null,
    sourceId: null,
    sourceName: "Solid color",
  };
}

function loadDesktopBackground() {
  try {
    const rawBackground = window.localStorage.getItem(desktopBackgroundStorageKey);
    return normalizeDesktopBackground(rawBackground ? JSON.parse(rawBackground) : null);
  } catch {
    return normalizeDesktopBackground(null);
  }
}

function saveDesktopBackground(background) {
  try {
    window.localStorage.setItem(desktopBackgroundStorageKey, JSON.stringify(background));
  } catch {
    // Large uploaded images may exceed localStorage. The background still applies for this session.
  }
}

function isUserDesktopFile(item) {
  return (
    typeof item?.id === "string" &&
    (item.id.startsWith("desktop-file-") || item.id.startsWith("desktop-document-"))
  );
}

function serializeDesktopFile(item) {
  return {
    id: item.id,
    appId: item.appId,
    title: item.title,
    icon: item.icon,
    order: item.order,
    fileType: item.fileType,
    content: item.content ?? "",
    paintFile: item.paintFile ?? null,
    documentId: item.documentId ?? null,
    documentItem: item.documentItem ? serializeDocumentItem(item.documentItem) : null,
    gridColumn: item.gridColumn,
    gridRow: item.gridRow,
    deletedAt: item.deletedAt ?? null,
  };
}

function normalizeDesktopFile(rawItem) {
  if (!isUserDesktopFile(rawItem)) {
    return null;
  }

  const fileDefinition = getDesktopFileDefinition(rawItem.fileType);
  if (!fileDefinition) {
    return null;
  }

  return {
    id: rawItem.id,
    appId: fileDefinition.appId,
    title: String(rawItem.title ?? "").trim() || "Untitled",
    icon: fileDefinition.icon,
    order: Number.isInteger(rawItem.order) ? rawItem.order : initialDesktopItems.length,
    fileType: rawItem.fileType,
    content: typeof rawItem.content === "string" ? rawItem.content : fileDefinition.content,
    paintFile: rawItem.paintFile ?? fileDefinition.paintFile,
    documentId: typeof rawItem.documentId === "string" ? rawItem.documentId : null,
    documentItem: rawItem.documentItem ? normalizeDocumentItem(rawItem.documentItem) : null,
    gridColumn: Number.isInteger(rawItem.gridColumn) ? rawItem.gridColumn : null,
    gridRow: Number.isInteger(rawItem.gridRow) ? rawItem.gridRow : null,
    deletedAt: Number.isFinite(rawItem.deletedAt) ? rawItem.deletedAt : undefined,
  };
}

function serializeDocumentItem(item) {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    size: item.size,
    modified: item.modified,
    icon: item.icon,
    description: item.description,
    content: item.content ?? "",
    preview: item.preview ?? "",
    actionLabel: item.actionLabel,
    appId: item.appId,
    paintFile: item.paintFile ?? null,
  };
}

function normalizeDocumentItem(rawItem) {
  if (!rawItem || typeof rawItem.id !== "string") {
    return null;
  }

  const isPaint = rawItem.appId === "paint" || rawItem.paintFile;
  return {
    id: rawItem.id,
    title: String(rawItem.title ?? "").trim() || "Untitled",
    type: typeof rawItem.type === "string" ? rawItem.type : isPaint ? "Bitmap Image" : "Text Document",
    size: typeof rawItem.size === "string" ? rawItem.size : "1 KB",
    modified: typeof rawItem.modified === "string" ? rawItem.modified : "06/23/26",
    icon: typeof rawItem.icon === "string"
      ? rawItem.icon
      : isPaint
        ? "./res/png/paint_file-0.png"
        : "./res/png/notepad_file-0.png",
    description: typeof rawItem.description === "string" ? rawItem.description : "A document.",
    content: typeof rawItem.content === "string" ? rawItem.content : "",
    preview: typeof rawItem.preview === "string" ? rawItem.preview : "",
    actionLabel: typeof rawItem.actionLabel === "string"
      ? rawItem.actionLabel
      : isPaint
        ? "Open in Paint"
        : "Open in Notepad",
    appId: isPaint ? "paint" : "notepad",
    paintFile: rawItem.paintFile ?? null,
  };
}

function getDesktopFileNumericId(item) {
  const match = /^desktop-file-(\d+)$/.exec(item.id);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function loadDesktopFilesState() {
  try {
    const rawState = window.localStorage.getItem(desktopFilesStorageKey);
    const parsedState = rawState ? JSON.parse(rawState) : {};
    const desktopItems = Array.isArray(parsedState.desktopItems)
      ? parsedState.desktopItems.map(normalizeDesktopFile).filter(Boolean)
      : [];
    const recycleBinItems = Array.isArray(parsedState.recycleBinItems)
      ? parsedState.recycleBinItems.map(normalizeDesktopFile).filter(Boolean)
      : [];
    const documentItems = Array.isArray(parsedState.documentItems)
      ? parsedState.documentItems.map(normalizeDocumentItem).filter(Boolean)
      : DOCUMENT_ITEMS.map((item) => ({ ...item }));
    const maxFileId = [...desktopItems, ...recycleBinItems].reduce((maxId, item) => {
      return Math.max(maxId, getDesktopFileNumericId(item));
    }, 0);
    const nextDesktopFileId = Math.max(
      Number.isInteger(parsedState.nextDesktopFileId) ? parsedState.nextDesktopFileId : 1,
      maxFileId + 1
    );

    return {
      desktopItems,
      documentItems,
      recycleBinItems,
      nextDesktopFileId,
    };
  } catch {
    return {
      desktopItems: [],
      documentItems: DOCUMENT_ITEMS.map((item) => ({ ...item })),
      recycleBinItems: [],
      nextDesktopFileId: 1,
    };
  }
}

function saveDesktopFilesState() {
  const state = {
    nextDesktopFileId: system.nextDesktopFileId,
    desktopItems: system.desktopItems.filter(isUserDesktopFile).map(serializeDesktopFile),
    documentItems: system.documentItems.map(serializeDocumentItem),
    recycleBinItems: system.recycleBinItems.filter(isUserDesktopFile).map(serializeDesktopFile),
  };

  try {
    window.localStorage.setItem(desktopFilesStorageKey, JSON.stringify(state));
  } catch {
    // Keep the in-memory desktop usable if storage quota is unavailable.
  }
}

function applyDesktopBackground(background) {
  const normalizedBackground = normalizeDesktopBackground(background);
  const backgroundImage =
    normalizedBackground.image && normalizedBackground.type !== "color"
      ? `url("${normalizedBackground.image}")`
      : "none";

  document.documentElement.style.setProperty("--desktop-bg", normalizedBackground.color);
  desktopElement.style.backgroundColor = normalizedBackground.color;
  desktopElement.style.backgroundImage = backgroundImage;
  desktopElement.style.backgroundPosition = "center";
  desktopElement.style.backgroundRepeat = "no-repeat";
  desktopElement.style.backgroundSize = "cover";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getDesktopFileDefinition(fileType) {
  if (fileType === "note") {
    return {
      appId: "notepad",
      icon: "./res/png/notepad_file-0.png",
      content: "",
      paintFile: null,
    };
  }

  if (fileType === "paint") {
    return {
      appId: "paint",
      icon: "./res/png/paint_file-0.png",
      content: "",
      paintFile: null,
    };
  }

  return null;
}

function getNextDesktopItemOrder() {
  return system.desktopItems.reduce((maxOrder, item) => Math.max(maxOrder, item.order), -1) + 1;
}

function getUniqueDesktopTitle(baseTitle, excludedItemId = null) {
  const normalizedBaseTitle = String(baseTitle ?? "").trim() || "Untitled";
  const existingTitles = new Set(
    system.desktopItems
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

function getUniqueDocumentSystemTitle(baseTitle, excludedItemId = null) {
  const normalizedBaseTitle = String(baseTitle ?? "").trim() || "Untitled";
  const existingTitles = new Set(
    system.documentItems
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

function getDesktopSlotFromClientPoint(clientX, clientY) {
  const desktopRect = desktopElement.getBoundingClientRect();
  return getNearestDesktopSlot(clientX - desktopRect.left, clientY - desktopRect.top);
}

function openDesktopItem(item) {
  if (!item || !windowManager.hasApp(item.appId)) {
    return;
  }

  windowManager.openWindow(item.appId, {
    fileName: item.title,
    content: item.content,
    paintFile: item.paintFile,
  });
}

function finishDesktopItemRename(itemId, rawTitle) {
  const item = system.getDesktopItem(itemId);
  if (!item) {
    renamingDesktopItemId = null;
    renderDesktopIcons();
    return;
  }

  item.title = getUniqueDesktopTitle(rawTitle, item.id);
  renamingDesktopItemId = null;
  saveDesktopFilesState();
  renderDesktopIcons();
}

function setDocumentDragProxyPosition(clientX, clientY) {
  documentDragProxyElement.style.transform = `translate(${clientX + 10}px, ${clientY + 10}px)`;
}

function showDocumentDragProxy(documentIds, clientX, clientY) {
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds];
  const item = system.getDocumentItem(ids[0]);
  if (!item) {
    return;
  }
  const label = ids.length > 1 ? `${ids.length} items` : item.title;

  documentDragProxyElement.innerHTML = `
    <img class="document-drag-proxy__image" src="${item.icon}" alt="" width="32" height="32" draggable="false">
    <span class="document-drag-proxy__label">${escapeHtml(label)}</span>
  `;
  setDocumentDragProxyPosition(clientX, clientY);
  documentDragProxyElement.classList.remove("document-drag-proxy--hidden");
}

function hideDocumentDragProxy() {
  documentDragProxyElement.classList.add("document-drag-proxy--hidden");
  documentDragProxyElement.innerHTML = "";
}

function showDesktopDragProxy(items) {
  desktopDragProxyElement.innerHTML = items
    .map((dragItem) => {
      const item = system.getDesktopItem(dragItem.itemId);
      if (!item) {
        return "";
      }

      const icon = item.appId === "recycle-bin" ? system.getRecycleBinIcon() : item.icon;

      return `
        <div
          class="desktop-drag-proxy__icon"
          data-desktop-drag-proxy-item="${item.id}"
          style="left: ${dragItem.left}px; top: ${dragItem.top}px;"
        >
          <img class="desktop-drag-proxy__image" src="${icon}" alt="" width="32" height="32" draggable="false">
          <span class="desktop-drag-proxy__label">${escapeHtml(item.title)}</span>
        </div>
      `;
    })
    .join("");

  desktopDragProxyElement.classList.remove("desktop-drag-proxy--hidden");
}

function setDesktopDragProxyPosition(deltaX, deltaY) {
  desktopDragProxyElement.querySelectorAll("[data-desktop-drag-proxy-item]").forEach((proxyItem) => {
    proxyItem.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  });
}

function hideDesktopDragProxy() {
  desktopDragProxyElement.classList.add("desktop-drag-proxy--hidden");
  desktopDragProxyElement.innerHTML = "";
}

function setStartMenuState(isOpen) {
  startMenu.classList.toggle("start-menu--hidden", !isOpen);
  startMenu.setAttribute("aria-hidden", String(!isOpen));
  startButton.setAttribute("aria-expanded", String(isOpen));

  if (!isOpen) {
    closeStartSubmenus();
  }
}

function toggleStartMenu() {
  const isOpen = startButton.getAttribute("aria-expanded") === "true";
  setStartMenuState(!isOpen);
}

function closeStartMenu() {
  setStartMenuState(false);
}

function closeStartSubmenus() {
  startMenu.querySelectorAll("[data-start-submenu]").forEach((submenu) => {
    submenu.classList.remove("start-menu__submenu-root--open");
  });

  startMenu.querySelectorAll("[data-start-submenu-toggle]").forEach((toggle) => {
    toggle.setAttribute("aria-expanded", "false");
  });
}

function toggleStartSubmenu(submenuName) {
  const submenu = startMenu.querySelector(`[data-start-submenu="${submenuName}"]`);
  const toggle = startMenu.querySelector(`[data-start-submenu-toggle="${submenuName}"]`);
  if (!submenu || !toggle) {
    return;
  }

  const isOpen = submenu.classList.toggle("start-menu__submenu-root--open");
  toggle.setAttribute("aria-expanded", String(isOpen));
}

function setDesktopContextMenuState(isOpen, x = 0, y = 0) {
  renderDesktopContextMenu();
  desktopContextMenuElement.classList.toggle("context-menu--hidden", !isOpen);
  desktopContextMenuElement.setAttribute("aria-hidden", String(!isOpen));

  if (!isOpen) {
    return;
  }

  const menuWidth = desktopContextMenuElement.offsetWidth;
  const menuHeight = desktopContextMenuElement.offsetHeight;
  const maxX = window.innerWidth - menuWidth - 4;
  const maxY = window.innerHeight - menuHeight - 55;

  desktopContextMenuElement.style.left = `${Math.max(4, Math.min(x, maxX))}px`;
  desktopContextMenuElement.style.top = `${Math.max(4, Math.min(y, maxY))}px`;
}

function closeDesktopContextMenu() {
  desktopContextMenuElement.dataset.contextItemId = "";
  desktopContextMenuState.clientX = 0;
  desktopContextMenuState.clientY = 0;
  setDesktopContextMenuState(false);
}

function getSelectedDesktopItemIds() {
  return Array.from(desktopIconsElement.querySelectorAll(".desktop-icon--selected"))
    .map((icon) => icon.dataset.desktopItemId)
    .filter(Boolean);
}

function getDesktopGridLimits() {
  const width = desktopElement.clientWidth;
  const height = windowLayerElement.clientHeight;
  const columns = Math.max(
    1,
    Math.floor((width - desktopGrid.startX - desktopGrid.iconWidth) / desktopGrid.stepX) + 1
  );
  const rows = Math.max(
    1,
    Math.floor((height - desktopGrid.startY - desktopGrid.iconHeight) / desktopGrid.stepY) + 1
  );

  return {
    columns,
    rows,
  };
}

function normalizeDesktopSlot(slot) {
  const { columns, rows } = getDesktopGridLimits();

  return {
    gridColumn: clamp(slot.gridColumn, 0, columns - 1),
    gridRow: clamp(slot.gridRow, 0, rows - 1),
  };
}

function getDefaultDesktopSlot(order) {
  const { rows } = getDesktopGridLimits();
  const safeOrder = Math.max(0, order ?? 0);

  return {
    gridColumn: Math.floor(safeOrder / rows),
    gridRow: safeOrder % rows,
  };
}

function getDesktopPositionFromSlot(gridColumn, gridRow) {
  const normalizedSlot = normalizeDesktopSlot({ gridColumn, gridRow });

  return {
    left: desktopGrid.startX + normalizedSlot.gridColumn * desktopGrid.stepX,
    top: desktopGrid.startY + normalizedSlot.gridRow * desktopGrid.stepY,
  };
}

function getNearestDesktopSlot(left, top) {
  const column = Math.round((left - desktopGrid.startX) / desktopGrid.stepX);
  const row = Math.round((top - desktopGrid.startY) / desktopGrid.stepY);

  return normalizeDesktopSlot({
    gridColumn: column,
    gridRow: row,
  });
}

function getDesktopItemElement(itemId) {
  return desktopIconsElement.querySelector(`[data-desktop-item-id="${itemId}"]`);
}

function getDesktopDragItems(primaryItemId) {
  const selectedItemIds = getSelectedDesktopItemIds();
  const dragItemIds = selectedItemIds.includes(primaryItemId) ? selectedItemIds : [primaryItemId];

  return dragItemIds
    .map((itemId) => {
      const item = system.getDesktopItem(itemId);
      if (!item) {
        return null;
      }

      return {
        itemId: item.id,
        ...getDesktopPositionFromSlot(item.gridColumn, item.gridRow),
      };
    })
    .filter(Boolean);
}

function getDesktopDragBounds(items) {
  return items.reduce(
    (bounds, item) => {
      return {
        minLeft: Math.min(bounds.minLeft, item.left),
        minTop: Math.min(bounds.minTop, item.top),
        maxLeft: Math.max(bounds.maxLeft, item.left),
        maxTop: Math.max(bounds.maxTop, item.top),
      };
    },
    {
      minLeft: Infinity,
      minTop: Infinity,
      maxLeft: -Infinity,
      maxTop: -Infinity,
    }
  );
}

function getRecycleBinDropTarget(excludedItemId = null) {
  const recycleBinItem = system.desktopItems.find((item) => {
    return item.appId === "recycle-bin" && item.id !== excludedItemId;
  });

  if (!recycleBinItem) {
    return null;
  }

  return getDesktopItemElement(recycleBinItem.id);
}

function clearRecycleBinDropState() {
  const recycleBinElement = getRecycleBinDropTarget();
  recycleBinElement?.classList.remove("desktop-icon--drop-target");
}

function isPointerOverElement(clientX, clientY, element) {
  if (!element) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

function getDocumentsDropTarget(clientX, clientY) {
  return (
    Array.from(windowLayerElement.querySelectorAll("[data-documents-list]")).find((element) => {
      return isPointerOverElement(clientX, clientY, element);
    }) ?? null
  );
}

function isPointOverEmptyDesktop(clientX, clientY) {
  return (
    isPointerOverElement(clientX, clientY, desktopElement) &&
    !document.elementFromPoint(clientX, clientY)?.closest(".window, .taskbar, .start-menu, .context-menu")
  );
}

function canMoveDesktopItemToDocuments(item) {
  return Boolean(item && isUserDesktopFile(item) && ["notepad", "paint"].includes(item.appId));
}

function deleteSelectedDesktopItems() {
  const selectedItemIds = getSelectedDesktopItemIds();
  if (selectedItemIds.length === 0) {
    return false;
  }

  system.deleteDesktopItems(selectedItemIds);
  return true;
}

function renderDesktopContextMenu() {
  if (desktopContextMenuState.type === "item") {
    const item = system.getDesktopItem(desktopContextMenuState.itemId);
    if (!item) {
      desktopContextMenuState = { type: "desktop", itemId: null };
      renderDesktopContextMenu();
      return;
    }

    desktopContextMenuElement.dataset.contextItemId = item.id;

    const isRecycleBin = item.appId === "recycle-bin";
    const canEmpty = system.recycleBinItems.length > 0;

    desktopContextMenuElement.innerHTML = `
      <button class="context-menu__item" type="button" data-context-action="open-item">Open</button>
      ${
        isRecycleBin
          ? ""
          : `
            <button class="context-menu__item" type="button" data-context-action="rename-item">Rename</button>
            <button class="context-menu__item" type="button" data-context-action="delete-item">Delete</button>
          `
      }
      ${
        isRecycleBin
          ? `
            <div class="context-menu__divider" aria-hidden="true"></div>
            <button class="context-menu__item" type="button" data-context-action="empty-recycle-bin" ${canEmpty ? "" : "disabled"}>
              Empty Recycle Bin
            </button>
          `
          : ""
      }
    `;
    return;
  }

  desktopContextMenuElement.dataset.contextItemId = "";

  desktopContextMenuElement.innerHTML = `
    <button class="context-menu__item" type="button" data-context-action="refresh-desktop">Refresh</button>
    <div class="context-menu__submenu-root">
      <button class="context-menu__item context-menu__item--has-submenu" type="button" aria-haspopup="true">
        <span>New</span>
        <span class="context-menu__submenu-arrow" aria-hidden="true"></span>
      </button>
      <section class="context-menu__flyout" aria-label="New file submenu">
        <button class="context-menu__item" type="button" data-new-file-type="note">Note Document</button>
        <button class="context-menu__item" type="button" data-new-file-type="paint">Paint Document</button>
      </section>
    </div>
    <div class="context-menu__divider" aria-hidden="true"></div>
    <button class="context-menu__item" type="button" data-context-action="set-background">Set Background...</button>
    <button class="context-menu__item" type="button" data-context-action="open-computer">Properties</button>
  `;
}

function renderDesktopIcons() {
  const selectedIds = new Set(getSelectedDesktopItemIds());

  desktopIconsElement.innerHTML = system.desktopItems
    .sort((left, right) => {
      if (left.gridColumn !== right.gridColumn) {
        return left.gridColumn - right.gridColumn;
      }

      if (left.gridRow !== right.gridRow) {
        return left.gridRow - right.gridRow;
      }

      return left.order - right.order;
    })
    .map((item) => {
      const isSelected = selectedIds.has(item.id);
      const isRenaming = renamingDesktopItemId === item.id;
      const icon = item.appId === "recycle-bin" ? system.getRecycleBinIcon() : item.icon;
      const position = getDesktopPositionFromSlot(item.gridColumn, item.gridRow);
      const labelMarkup = isRenaming
        ? `
          <input
            class="desktop-icon__rename-input"
            type="text"
            value="${escapeHtml(item.title)}"
            data-desktop-rename-input="${item.id}"
            aria-label="File name"
          >
        `
        : `<span class="desktop-icon__label">${escapeHtml(item.title)}</span>`;

      return `
        <div
          class="desktop-icon ${isSelected ? "desktop-icon--selected" : ""}"
          role="button"
          tabindex="0"
          data-desktop-item-id="${item.id}"
          data-app-id="${item.appId}"
          aria-selected="${String(isSelected)}"
          draggable="false"
          style="left: ${position.left}px; top: ${position.top}px;"
        >
          <img class="desktop-icon__image" src="${icon}" alt="" width="32" height="32" draggable="false">
          ${labelMarkup}
        </div>
      `;
    })
    .join("");

  if (renamingDesktopItemId) {
    window.requestAnimationFrame(() => {
      const input = desktopIconsElement.querySelector(
        `[data-desktop-rename-input="${renamingDesktopItemId}"]`
      );
      input?.focus();
      input?.select();
    });
  }
}

function setDesktopSelectionState(isVisible, rect = null) {
  desktopSelectionElement.classList.toggle("desktop-selection--hidden", !isVisible);

  if (!isVisible || !rect) {
    return;
  }

  desktopSelectionElement.style.left = `${rect.left}px`;
  desktopSelectionElement.style.top = `${rect.top}px`;
  desktopSelectionElement.style.width = `${rect.width}px`;
  desktopSelectionElement.style.height = `${rect.height}px`;
}

function clearDesktopIconSelection() {
  desktopIconsElement.querySelectorAll(".desktop-icon--selected").forEach((icon) => {
    icon.classList.remove("desktop-icon--selected");
    icon.setAttribute("aria-selected", "false");
  });
}

function selectDesktopIconsInRect(rect) {
  const desktopRect = desktopElement.getBoundingClientRect();
  let selectedCount = 0;

  desktopIconsElement.querySelectorAll(".desktop-icon").forEach((icon) => {
    const iconRect = icon.getBoundingClientRect();
    const relativeRect = {
      left: iconRect.left - desktopRect.left,
      top: iconRect.top - desktopRect.top,
      right: iconRect.right - desktopRect.left,
      bottom: iconRect.bottom - desktopRect.top,
    };

    const intersects =
      rect.left < relativeRect.right &&
      rect.right > relativeRect.left &&
      rect.top < relativeRect.bottom &&
      rect.bottom > relativeRect.top;

    icon.classList.toggle("desktop-icon--selected", intersects);
    icon.setAttribute("aria-selected", String(intersects));

    if (intersects) {
      selectedCount += 1;
    }
  });

  return selectedCount;
}

function setShutdownScreenState(isOpen) {
  shutdownScreenElement.classList.toggle("shutdown-screen--hidden", !isOpen);
  shutdownScreenElement.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("is-shut-down", isOpen);

  if (isOpen) {
    closeStartMenu();
    closeDesktopContextMenu();
  }
}

function setShuttingDownState(isPending) {
  document.body.classList.toggle("is-shutting-down", isPending);
}

function clearShutdownTimers() {
  shutdownTimeoutIds.forEach((timeoutId) => {
    window.clearTimeout(timeoutId);
  });
  shutdownTimeoutIds = [];
}

function startShutdownSequence() {
  const openWindowIds = windowManager.getWindowIds();
  const closeDelays = openWindowIds.map((_, index) => {
    return Math.round(((index + 1) * shutdownSequenceDuration) / (openWindowIds.length + 1));
  });

  setShuttingDownState(true);

  closeDelays.forEach((delay, index) => {
    const timeoutId = window.setTimeout(() => {
      windowManager.closeWindow(openWindowIds[index]);
    }, delay);

    shutdownTimeoutIds.push(timeoutId);
  });

  const finalTimeoutId = window.setTimeout(() => {
    setShuttingDownState(false);
    setShutdownScreenState(true);
    shutdownTimeoutIds = [];
  }, shutdownSequenceDuration);

  shutdownTimeoutIds.push(finalTimeoutId);
}

startButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleStartMenu();
});

startMenu.addEventListener("click", (event) => {
  event.stopPropagation();

  const submenuToggle = event.target.closest("[data-start-submenu-toggle]");
  if (submenuToggle) {
    toggleStartSubmenu(submenuToggle.dataset.startSubmenuToggle);
    return;
  }

  const menuItem = event.target.closest("[data-app-id]");
  if (!menuItem) {
    return;
  }

  const { appId } = menuItem.dataset;
  if (windowManager.hasApp(appId)) {
    windowManager.openWindow(appId);
  }

  closeStartMenu();
});

desktopIconsElement.addEventListener("mousedown", (event) => {
  if (event.button !== 0) {
    return;
  }

  if (event.target.closest("[data-desktop-rename-input]")) {
    return;
  }

  const icon = event.target.closest(".desktop-icon");
  if (!icon) {
    return;
  }

  const item = system.getDesktopItem(icon.dataset.desktopItemId);
  if (!item) {
    return;
  }

  if (!icon.classList.contains("desktop-icon--selected")) {
    clearDesktopIconSelection();
    icon.classList.add("desktop-icon--selected");
    icon.setAttribute("aria-selected", "true");
  }

  closeStartMenu();
  closeDesktopContextMenu();

  const position = getDesktopPositionFromSlot(item.gridColumn, item.gridRow);
  const dragItems = getDesktopDragItems(item.id);
  const dragBounds = getDesktopDragBounds(dragItems);
  desktopDragState = {
    primaryItemId: item.id,
    itemIds: dragItems.map((dragItem) => dragItem.itemId),
    items: dragItems,
    startPointerX: event.clientX,
    startPointerY: event.clientY,
    startLeft: position.left,
    startTop: position.top,
    minDeltaX: desktopGrid.startX - dragBounds.minLeft,
    minDeltaY: desktopGrid.startY - dragBounds.minTop,
    maxDeltaX: desktopGrid.startX + (getDesktopGridLimits().columns - 1) * desktopGrid.stepX - dragBounds.maxLeft,
    maxDeltaY: desktopGrid.startY + (getDesktopGridLimits().rows - 1) * desktopGrid.stepY - dragBounds.maxTop,
    currentDeltaX: 0,
    currentDeltaY: 0,
    didMove: false,
    isOverRecycleBin: false,
  };

  event.preventDefault();
});

desktopIconsElement.addEventListener("dragstart", (event) => {
  if (event.target.closest(".desktop-icon")) {
    event.preventDefault();
  }
});

desktopElement.addEventListener("mousedown", (event) => {
  if (event.button !== 0) {
    return;
  }

  if (
    event.target.closest(".window") ||
    event.target.closest(".desktop-icon") ||
    event.target.closest(".context-menu")
  ) {
    return;
  }

  const desktopRect = desktopElement.getBoundingClientRect();
  const startX = event.clientX - desktopRect.left;
  const startY = event.clientY - desktopRect.top;

  desktopSelectionState = {
    startX,
    startY,
  };

  closeStartMenu();
  closeDesktopContextMenu();
  setDesktopSelectionState(true, {
    left: startX,
    top: startY,
    width: 0,
    height: 0,
  });

  event.preventDefault();
});

desktopIconsElement.addEventListener("dblclick", (event) => {
  if (event.target.closest("[data-desktop-rename-input]")) {
    return;
  }

  const icon = event.target.closest("[data-app-id]");
  if (!icon) {
    return;
  }

  openDesktopItem(system.getDesktopItem(icon.dataset.desktopItemId));
});

desktopIconsElement.addEventListener("click", (event) => {
  if (event.target.closest("[data-desktop-rename-input]")) {
    return;
  }

  if (suppressDesktopIconClick) {
    suppressDesktopIconClick = false;
    event.preventDefault();
    return;
  }

  const icon = event.target.closest(".desktop-icon");
  if (!icon) {
    return;
  }

  clearDesktopIconSelection();
  icon.classList.add("desktop-icon--selected");
  icon.setAttribute("aria-selected", "true");
});

desktopIconsElement.addEventListener("keydown", (event) => {
  const renameInput = event.target.closest("[data-desktop-rename-input]");
  if (renameInput) {
    if (event.key === "Enter") {
      event.preventDefault();
      finishDesktopItemRename(renameInput.dataset.desktopRenameInput, renameInput.value);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      renamingDesktopItemId = null;
      renderDesktopIcons();
    }

    return;
  }

  const icon = event.target.closest(".desktop-icon");
  if (!icon) {
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openDesktopItem(system.getDesktopItem(icon.dataset.desktopItemId));
    return;
  }

  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();

    if (!icon.classList.contains("desktop-icon--selected")) {
      clearDesktopIconSelection();
      icon.classList.add("desktop-icon--selected");
      icon.setAttribute("aria-selected", "true");
    }

    system.deleteDesktopItems(getSelectedDesktopItemIds());
  }
});

desktopIconsElement.addEventListener("focusout", (event) => {
  const renameInput = event.target.closest("[data-desktop-rename-input]");
  if (!renameInput || renamingDesktopItemId !== renameInput.dataset.desktopRenameInput) {
    return;
  }

  finishDesktopItemRename(renameInput.dataset.desktopRenameInput, renameInput.value);
});

desktopIconsElement.addEventListener("contextmenu", (event) => {
  const icon = event.target.closest(".desktop-icon");
  if (!icon) {
    return;
  }

  event.preventDefault();

  if (!icon.classList.contains("desktop-icon--selected")) {
    clearDesktopIconSelection();
    icon.classList.add("desktop-icon--selected");
    icon.setAttribute("aria-selected", "true");
  }

  closeStartMenu();
  desktopContextMenuState = {
    type: "item",
    itemId: icon.dataset.desktopItemId ?? null,
    clientX: event.clientX,
    clientY: event.clientY,
  };
  setDesktopContextMenuState(true, event.clientX, event.clientY);
});

desktopElement.addEventListener("contextmenu", (event) => {
  if (event.target.closest(".window") || event.target.closest(".desktop-icon")) {
    return;
  }

  event.preventDefault();
  closeStartMenu();
  desktopContextMenuState = {
    type: "desktop",
    itemId: null,
    clientX: event.clientX,
    clientY: event.clientY,
  };
  setDesktopContextMenuState(true, event.clientX, event.clientY);
});

document.addEventListener("mousemove", (event) => {
  if (documentDragState) {
    const deltaX = event.clientX - documentDragState.startPointerX;
    const deltaY = event.clientY - documentDragState.startPointerY;
    documentDragState.currentPointerX = event.clientX;
    documentDragState.currentPointerY = event.clientY;

    if (!documentDragState.didMove && Math.hypot(deltaX, deltaY) >= 4) {
      documentDragState.didMove = true;
      showDocumentDragProxy(documentDragState.documentIds, event.clientX, event.clientY);
    }

    if (documentDragState.didMove) {
      setDocumentDragProxyPosition(event.clientX, event.clientY);
      event.preventDefault();
    }

    return;
  }

  if (desktopDragState) {
    const deltaX = event.clientX - desktopDragState.startPointerX;
    const deltaY = event.clientY - desktopDragState.startPointerY;

    if (!desktopDragState.didMove && Math.hypot(deltaX, deltaY) >= 4) {
      desktopDragState.didMove = true;
      showDesktopDragProxy(desktopDragState.items);
      desktopDragState.itemIds.forEach((itemId) => {
        getDesktopItemElement(itemId)?.classList.add("desktop-icon--drag-source");
      });
    }

    if (!desktopDragState.didMove) {
      return;
    }

    const nextDeltaX = clamp(deltaX, desktopDragState.minDeltaX, desktopDragState.maxDeltaX);
    const nextDeltaY = clamp(deltaY, desktopDragState.minDeltaY, desktopDragState.maxDeltaY);
    desktopDragState.currentDeltaX = nextDeltaX;
    desktopDragState.currentDeltaY = nextDeltaY;

    setDesktopDragProxyPosition(nextDeltaX, nextDeltaY);

    const recycleBinElement = getRecycleBinDropTarget();
    desktopDragState.isOverRecycleBin =
      !desktopDragState.itemIds.includes(recycleBinElement?.dataset.desktopItemId) &&
      isPointerOverElement(event.clientX, event.clientY, recycleBinElement);
    recycleBinElement?.classList.toggle(
      "desktop-icon--drop-target",
      desktopDragState.isOverRecycleBin
    );
    return;
  }

  if (!desktopSelectionState) {
    return;
  }

  const desktopRect = desktopElement.getBoundingClientRect();
  const currentX = Math.max(0, Math.min(event.clientX - desktopRect.left, desktopRect.width));
  const currentY = Math.max(0, Math.min(event.clientY - desktopRect.top, desktopRect.height));
  const left = Math.min(desktopSelectionState.startX, currentX);
  const top = Math.min(desktopSelectionState.startY, currentY);
  const width = Math.abs(currentX - desktopSelectionState.startX);
  const height = Math.abs(currentY - desktopSelectionState.startY);

  setDesktopSelectionState(true, {
    left,
    top,
    width,
    height,
  });
});

document.addEventListener("mouseup", (event) => {
  if (documentDragState) {
    if (documentDragState.didMove) {
      system.shouldSuppressDocumentClick = true;

      if (isPointOverEmptyDesktop(event.clientX, event.clientY)) {
        system.moveDocumentsToDesktop(
          documentDragState.documentIds,
          getDesktopSlotFromClientPoint(event.clientX, event.clientY)
        );
      }
    }

    documentDragState = null;
    hideDocumentDragProxy();
    return;
  }

  if (desktopDragState) {
    const primaryIcon = getDesktopItemElement(desktopDragState.primaryItemId);

    if (primaryIcon && desktopDragState.didMove) {
      const documentsDropTarget = getDocumentsDropTarget(event.clientX, event.clientY);
      const recycleBinElement = getRecycleBinDropTarget();
      const isOverRecycleBin =
        !desktopDragState.itemIds.includes(recycleBinElement?.dataset.desktopItemId) &&
        (desktopDragState.isOverRecycleBin ||
          isPointerOverElement(event.clientX, event.clientY, recycleBinElement));

      if (documentsDropTarget) {
        desktopDragState.itemIds
          .map((itemId) => system.getDesktopItem(itemId))
          .filter(canMoveDesktopItemToDocuments)
          .forEach((item) => {
            system.moveDesktopFileToDocuments(item.id);
          });
      } else if (isOverRecycleBin) {
        system.deleteDesktopItems(desktopDragState.itemIds);
      } else {
        const nextLeft = desktopDragState.startLeft + desktopDragState.currentDeltaX;
        const nextTop = desktopDragState.startTop + desktopDragState.currentDeltaY;
        system.moveDesktopItems(desktopDragState.itemIds, desktopDragState.primaryItemId, {
          left: nextLeft,
          top: nextTop,
        });
      }

      suppressDesktopIconClick = true;
    }

    clearRecycleBinDropState();
    hideDesktopDragProxy();

    desktopDragState.itemIds.forEach((itemId) => {
      getDesktopItemElement(itemId)?.classList.remove("desktop-icon--drag-source");
    });

    desktopDragState = null;
    return;
  }

  if (!desktopSelectionState) {
    return;
  }

  const selectionRect = {
    left: parseFloat(desktopSelectionElement.style.left) || desktopSelectionState.startX,
    top: parseFloat(desktopSelectionElement.style.top) || desktopSelectionState.startY,
    width: parseFloat(desktopSelectionElement.style.width) || 0,
    height: parseFloat(desktopSelectionElement.style.height) || 0,
  };
  const selectedCount = selectDesktopIconsInRect({
    ...selectionRect,
    right: selectionRect.left + selectionRect.width,
    bottom: selectionRect.top + selectionRect.height,
  });

  if (selectedCount === 0) {
    clearDesktopIconSelection();
  }

  desktopSelectionState = null;
  setDesktopSelectionState(false);
});

desktopContextMenuElement.addEventListener("click", (event) => {
  const newFileItem = event.target.closest("[data-new-file-type]");
  if (newFileItem) {
    const newItem = system.createDesktopFile(
      newFileItem.dataset.newFileType,
      getDesktopSlotFromClientPoint(desktopContextMenuState.clientX, desktopContextMenuState.clientY)
    );
    if (newItem) {
      clearDesktopIconSelection();
    }
    closeDesktopContextMenu();
    return;
  }

  const menuItem = event.target.closest("[data-context-action]");
  if (!menuItem) {
    return;
  }

  const { contextAction } = menuItem.dataset;
  const contextItemId = desktopContextMenuElement.dataset.contextItemId || desktopContextMenuState.itemId;

  if (contextAction === "refresh-desktop") {
    windowManager.render();
  }

  if (contextAction === "set-background") {
    windowManager.openWindow("desktop-background");
  }

  if (contextAction === "open-computer") {
    windowManager.openWindow("my-computer");
  }

  if (contextAction === "open-item" && contextItemId) {
    openDesktopItem(system.getDesktopItem(contextItemId));
  }

  if (contextAction === "rename-item" && contextItemId) {
    renamingDesktopItemId = contextItemId;
    clearDesktopIconSelection();
    renderDesktopIcons();
  }

  if (contextAction === "delete-item" && contextItemId) {
    const selectedItemIds = getSelectedDesktopItemIds();
    system.deleteDesktopItems(
      selectedItemIds.includes(contextItemId) ? selectedItemIds : [contextItemId]
    );
  }

  if (contextAction === "empty-recycle-bin") {
    if (system.recycleBinItems.length > 0) {
      system.emptyRecycleBin();
    }
  }

  closeDesktopContextMenu();
});

document.addEventListener("win95:window-action", (event) => {
  const { action, windowId } = event.detail ?? {};

  if (action === "close" && windowId) {
    windowManager.closeWindow(windowId);
  }
});

document.addEventListener("win95:shutdown", (event) => {
  const { action, windowId } = event.detail ?? {};

  if (windowId) {
    windowManager.closeWindow(windowId);
  }

  if (action === "restart") {
    window.location.reload();
    return;
  }

  clearShutdownTimers();
  startShutdownSequence();
});

document.addEventListener("win95:reset", () => {
  try {
    window.localStorage.clear();
  } finally {
    window.location.reload();
  }
});

document.addEventListener("click", (event) => {
  if (document.body.classList.contains("is-shut-down")) {
    return;
  }

  if (
    document.body.classList.contains("is-shutting-down")
  ) {
    return;
  }

  if (!startMenu.contains(event.target) && event.target !== startButton) {
    closeStartMenu();
  }

  if (!desktopContextMenuElement.contains(event.target)) {
    closeDesktopContextMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (document.body.classList.contains("is-shut-down")) {
    event.preventDefault();
    return;
  }

  if (document.body.classList.contains("is-shutting-down") && event.key !== "Tab") {
    event.preventDefault();
    return;
  }

  if (event.key === "Escape") {
    closeStartMenu();
    closeDesktopContextMenu();
  }

  if (
    (event.key === "Delete" || event.key === "Backspace") &&
    !(event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable='true']"))
  ) {
    if (deleteSelectedDesktopItems()) {
      event.preventDefault();
    }
  }
});

window.addEventListener("resize", () => {
  const occupiedSlots = new Set();

  system.desktopItems
    .sort((left, right) => left.order - right.order)
    .forEach((item) => {
      let nextSlot = normalizeDesktopSlot({
        gridColumn: item.gridColumn,
        gridRow: item.gridRow,
      });
      let slotKey = `${nextSlot.gridColumn}:${nextSlot.gridRow}`;

      if (occupiedSlots.has(slotKey)) {
        nextSlot = system.getNextAvailableDesktopSlot(nextSlot, item.id);
        slotKey = `${nextSlot.gridColumn}:${nextSlot.gridRow}`;
      }

      item.gridColumn = nextSlot.gridColumn;
      item.gridRow = nextSlot.gridRow;
      occupiedSlots.add(slotKey);
    });

  saveDesktopFilesState();
  renderDesktopIcons();
});

system.loadDesktopFiles();
system.initializeDesktopItems();
applyDesktopBackground(system.desktopBackground);
renderDesktopIcons();
updateClock();
setStartMenuState(false);
setDesktopContextMenuState(false);
setShuttingDownState(false);
setShutdownScreenState(false);
windowManager.render();
setInterval(updateClock, 1000);
