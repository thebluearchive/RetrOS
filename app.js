import { apps } from "./apps.js";
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
let shutdownTimeoutIds = [];
const desktopSelectionElement = document.createElement("div");
let desktopSelectionState = null;

desktopSelectionElement.className = "desktop-selection desktop-selection--hidden";
desktopSelectionElement.setAttribute("aria-hidden", "true");
desktopElement.insertBefore(desktopSelectionElement, windowLayerElement);

const windowManager = new WindowManager({
  apps,
  desktop: desktopElement,
  windowLayer: windowLayerElement,
  taskbarApps: taskbarAppsElement,
});

function updateClock() {
  const now = new Date();
  clockElement.textContent = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function setStartMenuState(isOpen) {
  startMenu.classList.toggle("start-menu--hidden", !isOpen);
  startMenu.setAttribute("aria-hidden", String(!isOpen));
  startButton.setAttribute("aria-expanded", String(isOpen));
}

function toggleStartMenu() {
  const isOpen = startButton.getAttribute("aria-expanded") === "true";
  setStartMenuState(!isOpen);
}

function closeStartMenu() {
  setStartMenuState(false);
}

function setDesktopContextMenuState(isOpen, x = 0, y = 0) {
  desktopContextMenuElement.classList.toggle("context-menu--hidden", !isOpen);
  desktopContextMenuElement.setAttribute("aria-hidden", String(!isOpen));

  if (!isOpen) {
    return;
  }

  const menuWidth = desktopContextMenuElement.offsetWidth;
  const menuHeight = desktopContextMenuElement.offsetHeight;
  const maxX = window.innerWidth - menuWidth - 4;
  const maxY = window.innerHeight - menuHeight - 46;

  desktopContextMenuElement.style.left = `${Math.max(4, Math.min(x, maxX))}px`;
  desktopContextMenuElement.style.top = `${Math.max(4, Math.min(y, maxY))}px`;
}

function closeDesktopContextMenu() {
  setDesktopContextMenuState(false);
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

desktopElement.addEventListener("mousedown", (event) => {
  if (event.button !== 0) {
    return;
  }

  if (event.target.closest(".window") || event.target.closest(".desktop-icon")) {
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
  const icon = event.target.closest("[data-app-id]");
  if (!icon) {
    return;
  }

  const { appId } = icon.dataset;
  if (windowManager.hasApp(appId)) {
    windowManager.openWindow(appId);
  }
});

desktopIconsElement.addEventListener("click", (event) => {
  const icon = event.target.closest(".desktop-icon");
  if (!icon) {
    return;
  }

  clearDesktopIconSelection();
  icon.classList.add("desktop-icon--selected");
  icon.setAttribute("aria-selected", "true");
});

desktopElement.addEventListener("contextmenu", (event) => {
  if (event.target.closest(".window") || event.target.closest(".desktop-icon")) {
    return;
  }

  event.preventDefault();
  closeStartMenu();
  setDesktopContextMenuState(true, event.clientX, event.clientY);
});

document.addEventListener("mousemove", (event) => {
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

document.addEventListener("mouseup", () => {
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
  const menuItem = event.target.closest("[data-context-action]");
  if (!menuItem) {
    return;
  }

  const { contextAction } = menuItem.dataset;

  if (contextAction === "open-browser") {
    windowManager.openWindow("browser");
  }

  if (contextAction === "refresh-desktop") {
    windowManager.render();
  }

  if (contextAction === "open-computer") {
    windowManager.openWindow("my-computer");
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

function restoreFromShutdownScreen() {
  clearShutdownTimers();
  setShuttingDownState(false);
  setShutdownScreenState(false);
}

document.addEventListener("click", (event) => {
  if (document.body.classList.contains("is-shut-down")) {
    if (shutdownScreenElement.contains(event.target) || event.target === shutdownScreenElement) {
      restoreFromShutdownScreen();
    }
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
    restoreFromShutdownScreen();
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
});

updateClock();
setStartMenuState(false);
setDesktopContextMenuState(false);
setShuttingDownState(false);
setShutdownScreenState(false);
windowManager.render();
setInterval(updateClock, 1000);
