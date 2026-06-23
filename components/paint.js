const PALETTE = [
  "#000000",
  "#808080",
  "#c0c0c0",
  "#ffffff",
  "#800000",
  "#ff0000",
  "#808000",
  "#ffff00",
  "#008000",
  "#00ff00",
  "#008080",
  "#00ffff",
  "#000080",
  "#0000ff",
  "#800080",
  "#ff00ff",
];
const BRUSH_SIZES = [1, 2, 4, 8, 12];
const MENUS = {
  file: [
    { action: "new", label: "New", shortcut: "Ctrl+N" },
    { action: "save", label: "Save", shortcut: "Ctrl+S" },
    { type: "separator" },
    { action: "exit", label: "Exit" },
  ],
  edit: [
    { action: "clear", label: "Clear Image", shortcut: "Del" },
  ],
  image: [
    { action: "pencil", label: "Pencil" },
    { action: "eraser", label: "Eraser" },
    { type: "separator" },
    { action: "size-1", label: "1 px" },
    { action: "size-2", label: "2 px" },
    { action: "size-4", label: "4 px" },
    { action: "size-8", label: "8 px" },
    { action: "size-12", label: "12 px" },
  ],
  help: [
    { action: "about", label: "About Paint" },
  ],
};

const drawingState = new Map();

function getCanvas(windowManager, windowItem) {
  return windowManager
    .getWindowElement(windowItem.id)
    ?.querySelector(`[data-paint-canvas="${windowItem.id}"]`);
}

function getCanvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor(((event.clientX - rect.left) * canvas.width) / rect.width),
    y: Math.floor(((event.clientY - rect.top) * canvas.height) / rect.height),
  };
}

function initializeCanvas(canvas) {
  if (canvas.dataset.paintInitialized === "true") {
    return;
  }

  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  canvas.dataset.paintInitialized = "true";
}

function drawLine(canvas, fromPoint, toPoint, windowItem) {
  const context = canvas.getContext("2d");
  const isEraser = windowItem.data.tool === "eraser";
  const size = windowItem.data.brushSize;
  const halfSize = Math.floor(size / 2);
  const deltaX = toPoint.x - fromPoint.x;
  const deltaY = toPoint.y - fromPoint.y;
  const steps = Math.max(Math.abs(deltaX), Math.abs(deltaY), 1);

  context.fillStyle = isEraser ? "#ffffff" : windowItem.data.color;

  for (let index = 0; index <= steps; index += 1) {
    const x = Math.round(fromPoint.x + (deltaX * index) / steps) - halfSize;
    const y = Math.round(fromPoint.y + (deltaY * index) / steps) - halfSize;
    context.fillRect(x, y, size, size);
  }
}

function startDrawing(canvas, event, windowItem) {
  initializeCanvas(canvas);
  const point = getCanvasPoint(canvas, event);
  drawingState.set(windowItem.id, {
    canvas,
    lastPoint: point,
  });
  drawLine(canvas, point, point, windowItem);
}

function continueDrawing(event, windowItem) {
  const state = drawingState.get(windowItem.id);
  if (!state) {
    return;
  }

  const nextPoint = getCanvasPoint(state.canvas, event);
  drawLine(state.canvas, state.lastPoint, nextPoint, windowItem);
  state.lastPoint = nextPoint;
}

function stopDrawing(windowItem) {
  drawingState.delete(windowItem.id);
}

function clearCanvas(windowManager, windowItem) {
  const canvas = getCanvas(windowManager, windowItem);
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  canvas.dataset.paintInitialized = "true";
}

function renderPaintFile(canvas, paintFile) {
  const context = canvas.getContext("2d");
  context.fillStyle = paintFile?.background ?? "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  (paintFile?.rects ?? []).forEach(([color, x, y, width, height]) => {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  });

  canvas.dataset.paintInitialized = "true";
}

function downloadCanvas(windowManager, windowItem) {
  const canvas = getCanvas(windowManager, windowItem);
  if (!canvas) {
    return;
  }

  initializeCanvas(canvas);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = (windowItem.data.fileName || "paint.bmp").replace(/\.[^.]+$/, ".png");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function closeMenus(windowItem) {
  windowItem.data.activeMenu = null;
}

function syncPaint(windowManager, windowItem) {
  closeMenus(windowItem);
  windowManager.syncAppWindow(windowItem.id);
}

function renderMenu(menuName, items, activeMenu) {
  const isOpen = activeMenu === menuName;

  return `
    <div class="paint-app__menu-slot">
      <button
        class="paint-app__menu-item"
        type="button"
        role="menuitem"
        aria-haspopup="true"
        aria-expanded="${String(isOpen)}"
        data-paint-menu-toggle="${menuName}"
      >
        ${menuName[0].toUpperCase()}${menuName.slice(1)}
      </button>
      <div
        class="paint-app__dropdown ${isOpen ? "" : "paint-app__dropdown--hidden"}"
        data-paint-menu="${menuName}"
        role="menu"
        aria-hidden="${String(!isOpen)}"
      >
        ${items
          .map((item) => {
            if (item.type === "separator") {
              return `<div class="paint-app__dropdown-divider" aria-hidden="true"></div>`;
            }

            return `
              <button
                class="paint-app__dropdown-item"
                type="button"
                role="menuitem"
                data-paint-menu-action="${item.action}"
              >
                <span>${item.label}</span>
                <span class="paint-app__shortcut">${item.shortcut ?? ""}</span>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function handleMenuAction(action, windowItem, windowManager) {
  if (action === "new") {
    windowItem.data.fileName = "Untitled.bmp";
    windowItem.data.paintFile = null;
    windowItem.data.loadedPaintFileId = null;
    clearCanvas(windowManager, windowItem);
    syncPaint(windowManager, windowItem);
    return true;
  }

  if (action === "clear") {
    clearCanvas(windowManager, windowItem);
    syncPaint(windowManager, windowItem);
    return true;
  }

  if (action === "save") {
    downloadCanvas(windowManager, windowItem);
    syncPaint(windowManager, windowItem);
    return true;
  }

  if (action === "exit") {
    windowManager.closeWindow(windowItem.id);
    return true;
  }

  if (action === "pencil" || action === "eraser") {
    windowItem.data.tool = action;
    syncPaint(windowManager, windowItem);
    return true;
  }

  if (action.startsWith("size-")) {
    windowItem.data.brushSize = Number.parseInt(action.replace("size-", ""), 10);
    syncPaint(windowManager, windowItem);
    return true;
  }

  if (action === "about") {
    windowItem.data.isAboutOpen = true;
    syncPaint(windowManager, windowItem);
    return true;
  }

  return false;
}

function renderPalette(selectedColor) {
  return PALETTE.map((color) => {
    const isSelected = color.toLowerCase() === selectedColor.toLowerCase();

    return `
      <button
        class="paint-app__swatch ${isSelected ? "paint-app__swatch--selected" : ""}"
        type="button"
        data-paint-color="${color}"
        aria-label="Use color ${color}"
        aria-pressed="${String(isSelected)}"
        style="--paint-swatch-color: ${color};"
      ></button>
    `;
  }).join("");
}

function renderSizeButtons(selectedSize) {
  return BRUSH_SIZES.map((size) => {
    const isSelected = size === selectedSize;

    return `
      <button
        class="paint-app__size-button ${isSelected ? "paint-app__size-button--selected" : ""}"
        type="button"
        data-paint-size="${size}"
        aria-label="Use brush size ${size}"
        aria-pressed="${String(isSelected)}"
      >
        <span class="paint-app__size-dot" style="--paint-size-dot: ${Math.max(3, size * 2)}px;"></span>
      </button>
    `;
  }).join("");
}

export const paintApp = {
  id: "paint",
  title: "Paint",
  icon: "./res/png/paint_file-0.png",
  defaultSize: {
    width: 760,
    height: 560,
  },
  minSize: {
    width: 520,
    height: 380,
  },
  defaultPosition: {
    x: 92,
    y: 58,
  },
  createState() {
    return {
      tool: "pencil",
      color: "#000000",
      brushSize: 4,
      activeMenu: null,
      isAboutOpen: false,
      fileName: "Untitled.bmp",
      paintFile: null,
      loadedPaintFileId: null,
    };
  },
  applyOpenOptions(windowItem, options) {
    if (typeof options.fileName === "string" && options.fileName.trim()) {
      windowItem.data.fileName = options.fileName.trim();
    }

    if (options.paintFile) {
      windowItem.data.paintFile = options.paintFile;
      windowItem.data.loadedPaintFileId = null;
    }

    windowItem.data.activeMenu = null;
    windowItem.data.isAboutOpen = false;
  },
  render(windowItem) {
    const isPencil = windowItem.data.tool === "pencil";
    const isEraser = windowItem.data.tool === "eraser";

    return `
      <div class="paint-app" data-paint-window="${windowItem.id}">
        <nav class="paint-app__menu" role="menubar" aria-label="Paint menu">
          ${Object.entries(MENUS).map(([menuName, items]) => renderMenu(menuName, items, windowItem.data.activeMenu)).join("")}
        </nav>
        <div class="paint-app__toolbar">
          <button class="win95-button paint-app__tool ${isPencil ? "paint-app__tool--active" : ""}" type="button" data-paint-tool="pencil" aria-pressed="${String(isPencil)}">
            Pencil
          </button>
          <button class="win95-button paint-app__tool ${isEraser ? "paint-app__tool--active" : ""}" type="button" data-paint-tool="eraser" aria-pressed="${String(isEraser)}">
            Eraser
          </button>
          <div class="paint-app__size-group" aria-label="Brush size">
            <span class="paint-app__size-label">Size</span>
            ${renderSizeButtons(windowItem.data.brushSize)}
          </div>
          <button class="win95-button paint-app__command" type="button" data-paint-action="clear">Clear</button>
          <button class="win95-button paint-app__command" type="button" data-paint-action="download">Save</button>
        </div>
        <div class="paint-app__workspace">
          <div class="paint-app__palette" aria-label="Color palette">
            ${renderPalette(windowItem.data.color)}
          </div>
          <div class="paint-app__canvas-frame">
            <canvas
              class="paint-app__canvas"
              data-paint-canvas="${windowItem.id}"
              width="320"
              height="200"
              aria-label="Paint canvas"
            ></canvas>
          </div>
        </div>
        <div class="paint-app__status">
          ${windowItem.data.fileName} | Tool: ${windowItem.data.tool} | Color: ${windowItem.data.color} | Size: ${windowItem.data.brushSize}px
        </div>
        <div
          class="paint-app__dialog-layer ${windowItem.data.isAboutOpen ? "" : "paint-app__dialog-layer--hidden"}"
          data-paint-about
          aria-hidden="${String(!windowItem.data.isAboutOpen)}"
        >
          <section class="paint-app__dialog win95-panel" role="dialog" aria-modal="true" aria-labelledby="paint-about-title-${windowItem.id}">
            <div class="paint-app__dialog-body">
              <img class="paint-app__dialog-icon" src="./res/png/paint_file-0.png" alt="" width="32" height="32">
              <div class="paint-app__dialog-copy">
                <h2 id="paint-about-title-${windowItem.id}" class="paint-app__dialog-title">About Paint</h2>
                <p class="paint-app__dialog-text">A tiny bitmap drawing program.</p>
              </div>
            </div>
            <div class="paint-app__dialog-actions">
              <button class="win95-button" type="button" data-paint-about-close>OK</button>
            </div>
          </section>
        </div>
      </div>
    `;
  },
  sync(element, windowItem) {
    const root = element.querySelector(`[data-paint-window="${windowItem.id}"]`);
    if (!root) {
      return;
    }

    const canvas = root.querySelector(`[data-paint-canvas="${windowItem.id}"]`);
    if (canvas && windowItem.data.paintFile && windowItem.data.loadedPaintFileId !== windowItem.data.paintFile.id) {
      renderPaintFile(canvas, windowItem.data.paintFile);
      windowItem.data.loadedPaintFileId = windowItem.data.paintFile.id;
    }

    const activeMenu = windowItem.data.activeMenu;
    root.querySelectorAll("[data-paint-menu-toggle]").forEach((button) => {
      const isOpen = activeMenu === button.dataset.paintMenuToggle;
      button.setAttribute("aria-expanded", String(isOpen));
    });

    root.querySelectorAll("[data-paint-menu]").forEach((menu) => {
      const isOpen = activeMenu === menu.dataset.paintMenu;
      menu.classList.toggle("paint-app__dropdown--hidden", !isOpen);
      menu.setAttribute("aria-hidden", String(!isOpen));
    });

    root.querySelectorAll("[data-paint-tool]").forEach((button) => {
      const isActive = button.dataset.paintTool === windowItem.data.tool;
      button.classList.toggle("paint-app__tool--active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    root.querySelectorAll("[data-paint-size]").forEach((button) => {
      const isSelected = Number.parseInt(button.dataset.paintSize, 10) === windowItem.data.brushSize;
      button.classList.toggle("paint-app__size-button--selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });

    const palette = root.querySelector(".paint-app__palette");
    if (palette) {
      palette.innerHTML = renderPalette(windowItem.data.color);
    }

    const status = root.querySelector(".paint-app__status");
    if (status) {
      status.textContent = `${windowItem.data.fileName} | Tool: ${windowItem.data.tool} | Color: ${windowItem.data.color} | Size: ${windowItem.data.brushSize}px`;
    }

    const dialogLayer = root.querySelector("[data-paint-about]");
    if (dialogLayer) {
      dialogLayer.classList.toggle("paint-app__dialog-layer--hidden", !windowItem.data.isAboutOpen);
      dialogLayer.setAttribute("aria-hidden", String(!windowItem.data.isAboutOpen));
    }
  },
  handleEvent({ type, event, windowItem, windowManager }) {
    if (type === "click") {
      const aboutClose = event.target.closest("[data-paint-about-close]");
      if (aboutClose) {
        windowItem.data.isAboutOpen = false;
        syncPaint(windowManager, windowItem);
        return true;
      }

      const menuToggle = event.target.closest("[data-paint-menu-toggle]");
      if (menuToggle) {
        const nextMenu = menuToggle.dataset.paintMenuToggle;
        windowItem.data.activeMenu = windowItem.data.activeMenu === nextMenu ? null : nextMenu;
        windowManager.syncAppWindow(windowItem.id);
        return true;
      }

      const menuAction = event.target.closest("[data-paint-menu-action]");
      if (menuAction) {
        return handleMenuAction(menuAction.dataset.paintMenuAction, windowItem, windowManager);
      }

      const toolButton = event.target.closest("[data-paint-tool]");
      if (toolButton) {
        windowItem.data.tool = toolButton.dataset.paintTool;
        syncPaint(windowManager, windowItem);
        return true;
      }

      const swatchButton = event.target.closest("[data-paint-color]");
      if (swatchButton) {
        windowItem.data.color = swatchButton.dataset.paintColor;
        windowItem.data.tool = "pencil";
        syncPaint(windowManager, windowItem);
        return true;
      }

      const sizeButton = event.target.closest("[data-paint-size]");
      if (sizeButton) {
        windowItem.data.brushSize = Number.parseInt(sizeButton.dataset.paintSize, 10);
        syncPaint(windowManager, windowItem);
        return true;
      }

      const actionButton = event.target.closest("[data-paint-action]");
      if (actionButton?.dataset.paintAction === "clear") {
        clearCanvas(windowManager, windowItem);
        syncPaint(windowManager, windowItem);
        return true;
      }

      if (actionButton?.dataset.paintAction === "download") {
        downloadCanvas(windowManager, windowItem);
        syncPaint(windowManager, windowItem);
        return true;
      }

      return false;
    }

    if (type === "mousedown") {
      const canvas = event.target.closest(`[data-paint-canvas="${windowItem.id}"]`);
      if (!canvas || event.button !== 0) {
        return false;
      }

      event.preventDefault();
      startDrawing(canvas, event, windowItem);

      const handleMouseMove = (moveEvent) => continueDrawing(moveEvent, windowItem);
      const handleMouseUp = () => {
        stopDrawing(windowItem);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return true;
    }

    if (type === "keydown") {
      const key = event.key.toLowerCase();
      if (!event.ctrlKey && event.key !== "Delete") {
        return false;
      }

      if (event.ctrlKey && key === "n") {
        event.preventDefault();
        return handleMenuAction("new", windowItem, windowManager);
      }

      if (event.ctrlKey && key === "s") {
        event.preventDefault();
        return handleMenuAction("save", windowItem, windowManager);
      }

      if (event.key === "Delete") {
        event.preventDefault();
        return handleMenuAction("clear", windowItem, windowManager);
      }
    }

    return false;
  },
};
