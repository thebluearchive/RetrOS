function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export class WindowManager {
  constructor({ apps, desktop, windowLayer, taskbarApps, system = null }) {
    this.apps = apps;
    this.desktop = desktop;
    this.windowLayer = windowLayer;
    this.taskbarApps = taskbarApps;
    this.system = system;
    this.state = {
      windows: [],
      nextWindowId: 1,
      nextZIndex: 10,
    };
    this.dragState = null;
    this.resizeState = null;

    this.windowLayer.addEventListener("mousedown", this.handleWindowLayerMouseDown.bind(this));
    this.windowLayer.addEventListener("click", this.handleWindowLayerClick.bind(this));
    this.windowLayer.addEventListener("mouseover", this.handleWindowLayerMouseOver.bind(this));
    this.windowLayer.addEventListener("dblclick", this.handleWindowLayerDoubleClick.bind(this));
    this.windowLayer.addEventListener("input", this.handleWindowLayerInput.bind(this));
    this.windowLayer.addEventListener("change", this.handleWindowLayerChange.bind(this));
    this.windowLayer.addEventListener("keydown", this.handleWindowLayerKeyDown.bind(this));
    this.windowLayer.addEventListener("submit", this.handleWindowLayerSubmit.bind(this), true);
    this.taskbarApps.addEventListener("click", this.handleTaskbarClick.bind(this));
  }

  hasApp(appId) {
    return Boolean(this.apps[appId]);
  }

  openWindow(appId) {
    const app = this.apps[appId];

    if (!app) {
      return;
    }

    const existingWindow = this.state.windows.find((windowItem) => windowItem.appId === appId);

    if (existingWindow) {
      existingWindow.isMinimized = false;
      this.focusWindow(existingWindow.id);
      this.render();
      return;
    }

    const windowId = `window-${this.state.nextWindowId}`;
    this.state.nextWindowId += 1;

    const windowItem = {
      id: windowId,
      appId: app.id,
      title: app.title,
      icon: app.icon,
      data: typeof app.createState === "function" ? app.createState() : {},
      x: app.defaultPosition.x,
      y: app.defaultPosition.y,
      width: app.defaultSize.width,
      height: app.defaultSize.height,
      minWidth: app.minSize?.width ?? 288,
      minHeight: app.minSize?.height ?? 192,
      isMinimized: false,
      isMaximized: false,
      restoreBounds: null,
      isActive: true,
      zIndex: this.consumeZIndex(),
    };

    this.state.windows.forEach((item) => {
      item.isActive = false;
    });
    this.state.windows.push(windowItem);
    this.render();
  }

  closeWindow(windowId) {
    this.state.windows = this.state.windows.filter((windowItem) => windowItem.id !== windowId);

    const topWindow = this.getTopVisibleWindow();
    if (topWindow) {
      topWindow.isActive = true;
    }

    this.render();
  }

  focusWindow(windowId) {
    const target = this.state.windows.find((windowItem) => windowItem.id === windowId);
    if (!target) {
      return;
    }

    if (target.isActive && !target.isMinimized) {
      return;
    }

    this.state.windows.forEach((windowItem) => {
      windowItem.isActive = false;
    });

    target.isActive = true;
    target.isMinimized = false;
    target.zIndex = this.consumeZIndex();
    this.render();
  }

  minimizeWindow(windowId) {
    const target = this.state.windows.find((windowItem) => windowItem.id === windowId);
    if (!target) {
      return;
    }

    target.isMinimized = true;
    target.isActive = false;

    const topWindow = this.getTopVisibleWindow(windowId);
    if (topWindow) {
      topWindow.isActive = true;
    }

    this.render();
  }

  toggleMaximizeWindow(windowId) {
    const target = this.state.windows.find((windowItem) => windowItem.id === windowId);
    if (!target) {
      return;
    }

    if (target.isMaximized) {
      this.restoreWindow(windowId);
      return;
    }

    target.restoreBounds = {
      x: target.x,
      y: target.y,
      width: target.width,
      height: target.height,
    };

    const bounds = this.getMaximizedBounds();
    target.x = bounds.x;
    target.y = bounds.y;
    target.width = bounds.width;
    target.height = bounds.height;
    target.isMaximized = true;
    this.state.windows.forEach((windowItem) => {
      windowItem.isActive = false;
    });
    target.isActive = true;
    target.zIndex = this.consumeZIndex();
    this.render();
  }

  restoreWindow(windowId) {
    const target = this.state.windows.find((windowItem) => windowItem.id === windowId);
    if (!target || !target.restoreBounds) {
      return;
    }

    target.x = target.restoreBounds.x;
    target.y = target.restoreBounds.y;
    target.width = target.restoreBounds.width;
    target.height = target.restoreBounds.height;
    target.restoreBounds = null;
    target.isMaximized = false;
    this.state.windows.forEach((windowItem) => {
      windowItem.isActive = false;
    });
    target.isActive = true;
    target.zIndex = this.consumeZIndex();
    this.render();
  }

  toggleTaskbarWindow(windowId) {
    const target = this.state.windows.find((windowItem) => windowItem.id === windowId);
    if (!target) {
      return;
    }

    if (target.isMinimized) {
      target.isMinimized = false;
      this.focusWindow(windowId);
      return;
    }

    if (target.isActive) {
      this.minimizeWindow(windowId);
      return;
    }

    this.focusWindow(windowId);
  }

  moveWindow(windowId, x, y) {
    const target = this.state.windows.find((windowItem) => windowItem.id === windowId);
    if (!target) {
      return;
    }

    const maxX = Math.max(0, this.desktop.clientWidth - 144);
    const maxY = Math.max(0, this.desktop.clientHeight - 96);

    target.x = clamp(x, 0, maxX);
    target.y = clamp(y, 0, maxY);
    this.render();
  }

  resizeWindow(windowId, nextRect) {
    const target = this.state.windows.find((windowItem) => windowItem.id === windowId);
    if (!target) {
      return;
    }

    const desktopWidth = this.desktop.clientWidth;
    const desktopHeight = this.desktop.clientHeight - 2;
    const minWidth = target.minWidth;
    const minHeight = target.minHeight;

    let x = nextRect.x;
    let y = nextRect.y;
    let width = nextRect.width;
    let height = nextRect.height;

    if (width < minWidth) {
      width = minWidth;
      if (nextRect.edge.includes("left")) {
        x = target.x + target.width - minWidth;
      }
    }

    if (height < minHeight) {
      height = minHeight;
      if (nextRect.edge.includes("top")) {
        y = target.y + target.height - minHeight;
      }
    }

    if (x < 0) {
      width += x;
      x = 0;
    }

    if (y < 0) {
      height += y;
      y = 0;
    }

    width = Math.max(minWidth, Math.min(width, desktopWidth - x));
    height = Math.max(minHeight, Math.min(height, desktopHeight - y));

    target.x = x;
    target.y = y;
    target.width = width;
    target.height = height;
    this.render();
  }

  render() {
    this.renderWindows();
    this.renderTaskbar();
  }

  renderWindows() {
    const visibleWindows = this.state.windows
      .filter((windowItem) => !windowItem.isMinimized)
      .sort((left, right) => left.zIndex - right.zIndex);

    const visibleIds = new Set(visibleWindows.map((windowItem) => windowItem.id));

    Array.from(this.windowLayer.children).forEach((child) => {
      if (!visibleIds.has(child.dataset.windowId)) {
        child.remove();
      }
    });

    visibleWindows.forEach((windowItem) => {
      let element = this.windowLayer.querySelector(`[data-window-id="${windowItem.id}"]`);

      if (!element) {
        element = this.createWindowElement(windowItem);
        this.windowLayer.appendChild(element);
      }

      this.updateWindowElement(element, windowItem);
    });
  }

  renderTaskbar() {
    const buttonsMarkup = this.state.windows
      .map((windowItem) => {
        const isPressed = windowItem.isActive && !windowItem.isMinimized;
        const activeClass = isPressed ? "taskbar__app-button--active" : "";

        return `
          <button
            class="taskbar__app-button win95-button ${activeClass}"
            type="button"
            data-window-id="${windowItem.id}"
            aria-pressed="${String(isPressed)}"
          >
            <img class="taskbar__app-icon" src="${windowItem.icon}" alt="" width="16" height="16">
            <span>${windowItem.title}</span>
          </button>
        `;
      })
      .join("");

    this.taskbarApps.innerHTML = buttonsMarkup;
  }

  async handleWindowLayerClick(event) {
    if (await this.dispatchAppEvent("click", event)) {
      return;
    }

    const button = event.target.closest("[data-action]");
    if (button) {
      const { action, windowId } = button.dataset;
      if (action === "close") {
        this.closeWindow(windowId);
      }
      if (action === "minimize") {
        this.minimizeWindow(windowId);
      }
      if (action === "maximize") {
        this.toggleMaximizeWindow(windowId);
      }
      if (action === "restore") {
        this.toggleMaximizeWindow(windowId);
      }
      return;
    }

    const windowElement = event.target.closest("[data-window-id]");
    if (windowElement) {
      this.focusWindow(windowElement.dataset.windowId);
    }
  }

  handleWindowLayerMouseOver(event) {
    this.dispatchAppEvent("mouseover", event);
  }

  async handleWindowLayerDoubleClick(event) {
    if (event.target.closest("[data-action]")) {
      return;
    }

    if (!event.target.closest("[data-drag-handle]") && await this.dispatchAppEvent("dblclick", event)) {
      return;
    }

    const titleBar = event.target.closest("[data-drag-handle]");
    const windowElement = event.target.closest("[data-window-id]");

    if (!titleBar || !windowElement) {
      return;
    }

    this.toggleMaximizeWindow(windowElement.dataset.windowId);
  }

  async handleWindowLayerSubmit(event) {
    await this.dispatchAppEvent("submit", event);
  }

  async handleWindowLayerInput(event) {
    await this.dispatchAppEvent("input", event);
  }

  async handleWindowLayerChange(event) {
    await this.dispatchAppEvent("change", event);
  }

  async handleWindowLayerKeyDown(event) {
    await this.dispatchAppEvent("keydown", event);
  }

  handleTaskbarClick(event) {
    const button = event.target.closest("[data-window-id]");
    if (!button) {
      return;
    }

    this.toggleTaskbarWindow(button.dataset.windowId);
  }

  handleWindowLayerMouseDown(event) {
    const resizeHandle = event.target.closest("[data-resize-edge]");
    if (resizeHandle) {
      this.startResize(event, resizeHandle);
      return;
    }

    if (event.target.closest("[data-action]")) {
      return;
    }

    const handle = event.target.closest("[data-drag-handle]");
    const windowElement = event.target.closest("[data-window-id]");

    if (!handle || !windowElement) {
      return;
    }

    const target = this.state.windows.find((windowItem) => windowItem.id === windowElement.dataset.windowId);

    if (!target) {
      return;
    }

    if (target.isMaximized) {
      this.focusWindow(target.id);
      return;
    }

    this.focusWindow(target.id);

    this.dragState = {
      windowId: target.id,
      offsetX: event.clientX - target.x,
      offsetY: event.clientY - target.y,
    };

    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);

    document.addEventListener("mousemove", this.boundHandleMouseMove);
    document.addEventListener("mouseup", this.boundHandleMouseUp);
  }

  handleMouseMove(event) {
    if (this.resizeState) {
      this.handleResizeMove(event);
      return;
    }

    if (!this.dragState) {
      return;
    }

    const nextX = event.clientX - this.dragState.offsetX;
    const nextY = event.clientY - this.dragState.offsetY;
    this.moveWindow(this.dragState.windowId, nextX, nextY);
  }

  handleMouseUp() {
    this.dragState = null;
    this.resizeState = null;
    document.removeEventListener("mousemove", this.boundHandleMouseMove);
    document.removeEventListener("mouseup", this.boundHandleMouseUp);
    this.boundHandleMouseMove = null;
    this.boundHandleMouseUp = null;
  }

  startResize(event, resizeHandle) {
    const windowId = resizeHandle.dataset.windowId;
    const edge = resizeHandle.dataset.resizeEdge;
    const target = this.state.windows.find((windowItem) => windowItem.id === windowId);

    if (!target || !edge) {
      return;
    }

    if (target.isMaximized) {
      return;
    }

    this.focusWindow(target.id);

    this.resizeState = {
      windowId: target.id,
      edge,
      startX: event.clientX,
      startY: event.clientY,
      originX: target.x,
      originY: target.y,
      originWidth: target.width,
      originHeight: target.height,
    };

    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);

    document.addEventListener("mousemove", this.boundHandleMouseMove);
    document.addEventListener("mouseup", this.boundHandleMouseUp);
  }

  handleResizeMove(event) {
    if (!this.resizeState) {
      return;
    }

    const {
      windowId,
      edge,
      startX,
      startY,
      originX,
      originY,
      originWidth,
      originHeight,
    } = this.resizeState;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    const nextRect = {
      x: originX,
      y: originY,
      width: originWidth,
      height: originHeight,
      edge,
    };

    if (edge.includes("right")) {
      nextRect.width = originWidth + deltaX;
    }

    if (edge.includes("left")) {
      nextRect.x = originX + deltaX;
      nextRect.width = originWidth - deltaX;
    }

    if (edge.includes("bottom")) {
      nextRect.height = originHeight + deltaY;
    }

    if (edge.includes("top")) {
      nextRect.y = originY + deltaY;
      nextRect.height = originHeight - deltaY;
    }

    this.resizeWindow(windowId, nextRect);
  }

  getTopVisibleWindow(excludedWindowId) {
    return this.state.windows
      .filter((windowItem) => !windowItem.isMinimized && windowItem.id !== excludedWindowId)
      .sort((left, right) => right.zIndex - left.zIndex)[0];
  }

  consumeZIndex() {
    this.state.nextZIndex += 1;
    return this.state.nextZIndex;
  }

  getMaximizedBounds() {
    return {
      x: 0,
      y: 0,
      width: this.windowLayer.clientWidth,
      height: this.windowLayer.clientHeight,
    };
  }

  createWindowElement(windowItem) {
    const app = this.apps[windowItem.appId];
    const element = document.createElement("section");
    element.dataset.windowId = windowItem.id;
    element.innerHTML = `
      <header class="window__titlebar" data-drag-handle="true">
        <div class="window__title">
          <img class="window__icon" alt="" width="16" height="16">
          <span></span>
        </div>
        <div class="window__controls">
          <button class="window__control win95-button" type="button" data-action="minimize" data-window-id="${windowItem.id}" aria-label="Minimize">
            <span class="window__control-glyph window__control-glyph--minimize" aria-hidden="true"></span>
          </button>
          <button class="window__control win95-button" type="button" data-action="maximize" data-window-id="${windowItem.id}" aria-label="Maximize">
            <span class="window__control-glyph window__control-glyph--maximize" aria-hidden="true"></span>
          </button>
          <button class="window__control win95-button" type="button" data-action="close" data-window-id="${windowItem.id}" aria-label="Close">
            <span class="window__control-glyph window__control-glyph--close" aria-hidden="true"></span>
          </button>
        </div>
      </header>
      <div class="window__body"></div>
    `;

    const body = element.querySelector(".window__body");
    body.innerHTML = app.render(windowItem, this.system, this);
    this.syncResizeHandles(element, windowItem);

    return element;
  }

  updateWindowElement(element, windowItem) {
    const activeClass = windowItem.isActive ? "window--active" : "window--inactive";
    const titleBarClass = windowItem.isActive ? "window__titlebar--active" : "window__titlebar--inactive";
    const titleBar = element.querySelector(".window__titlebar");
    const icon = element.querySelector(".window__icon");
    const titleText = element.querySelector(".window__title span");
    const maximizeButton = element.querySelector('[data-action="maximize"], [data-action="restore"]');
    const maximizeGlyph = maximizeButton?.querySelector(".window__control-glyph");

    element.className = `window ${activeClass}`;
    element.style.left = `${windowItem.x}px`;
    element.style.top = `${windowItem.y}px`;
    element.style.width = `${windowItem.width}px`;
    element.style.height = `${windowItem.height}px`;
    element.style.zIndex = String(windowItem.zIndex);

    titleBar.className = `window__titlebar ${titleBarClass}`;
    icon.src = windowItem.icon;
    titleText.textContent = windowItem.title;

    if (maximizeButton) {
      maximizeButton.dataset.action = windowItem.isMaximized ? "restore" : "maximize";
      maximizeButton.setAttribute("aria-label", windowItem.isMaximized ? "Restore" : "Maximize");
    }

    if (maximizeGlyph) {
      maximizeGlyph.className = `window__control-glyph ${
        windowItem.isMaximized
          ? "window__control-glyph--restore"
          : "window__control-glyph--maximize"
      }`;
    }

    this.syncResizeHandles(element, windowItem);

    const app = this.apps[windowItem.appId];
    if (typeof app.sync === "function") {
      app.sync(element, windowItem, this, this.system);
    }
  }

  syncResizeHandles(element, windowItem) {
    element.querySelectorAll(".window__resize-handle").forEach((handle) => handle.remove());

    if (windowItem.isMaximized) {
      return;
    }

    const edges = ["top-left", "top-right", "bottom-left", "bottom-right"];

    edges.forEach((edge) => {
      const handle = document.createElement("button");
      handle.className = `window__resize-handle window__resize-handle--${edge}`;
      handle.type = "button";
      handle.dataset.resizeEdge = edge;
      handle.dataset.windowId = windowItem.id;
      handle.setAttribute("aria-label", `Resize from ${edge.replace("-", " ")}`);
      element.appendChild(handle);
    });
  }

  normalizeUrl(rawValue) {
    const value = String(rawValue ?? "").trim();

    if (!value) {
      return "";
    }

    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    return `https://${value}`;
  }

  getWindowElement(windowId) {
    return this.windowLayer.querySelector(`[data-window-id="${windowId}"]`);
  }

  getWindowIds(options = {}) {
    const excludeWindowIds = new Set(options.excludeWindowIds ?? []);

    return this.state.windows
      .filter((windowItem) => !excludeWindowIds.has(windowItem.id))
      .sort((left, right) => right.zIndex - left.zIndex)
      .map((windowItem) => windowItem.id);
  }

  syncAppWindow(windowId) {
    const windowItem = this.state.windows.find((item) => item.id === windowId);
    if (!windowItem) {
      return;
    }

    const element = this.getWindowElement(windowId);
    if (!element) {
      return;
    }

    const app = this.apps[windowItem.appId];
    if (typeof app.sync === "function") {
      app.sync(element, windowItem, this, this.system);
    }
  }

  syncWindowsByAppId(appId) {
    this.state.windows
      .filter((windowItem) => windowItem.appId === appId)
      .forEach((windowItem) => {
        this.syncAppWindow(windowItem.id);
      });
  }

  async dispatchAppEvent(type, event) {
    const windowElement = event.target.closest("[data-window-id]");
    if (!windowElement) {
      return false;
    }

    const windowItem = this.state.windows.find((item) => item.id === windowElement.dataset.windowId);
    if (!windowItem) {
      return false;
    }

    const app = this.apps[windowItem.appId];
    if (typeof app.handleEvent !== "function") {
      return false;
    }

    return await app.handleEvent({
      type,
      event,
      windowItem,
      windowManager: this,
      system: this.system,
    });
  }
}
