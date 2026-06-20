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

desktopElement.addEventListener("contextmenu", (event) => {
  if (event.target.closest(".window") || event.target.closest(".desktop-icon")) {
    return;
  }

  event.preventDefault();
  closeStartMenu();
  setDesktopContextMenuState(true, event.clientX, event.clientY);
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

document.addEventListener("click", (event) => {
  if (!startMenu.contains(event.target) && event.target !== startButton) {
    closeStartMenu();
  }

  if (!desktopContextMenuElement.contains(event.target)) {
    closeDesktopContextMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeStartMenu();
    closeDesktopContextMenu();
  }
});

updateClock();
setStartMenuState(false);
setDesktopContextMenuState(false);
windowManager.render();
setInterval(updateClock, 1000);
