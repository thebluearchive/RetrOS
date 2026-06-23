const COMPUTER_ITEMS = [
  {
    id: "drive-c",
    title: "Local Disk (C:)",
    subtitle: "Portfolio system files",
    icon: "./res/png/hard_disk_drive-0.png",
    appId: "portfolio",
    kind: "Hard Disk",
    size: "95.0 MB",
  },
  {
    id: "documents",
    title: "My Documents",
    subtitle: "Notes, writing, and case studies",
    icon: "./res/png/directory_open_file_mydocs_small-0.png",
    appId: "documents",
    kind: "Folder",
    size: "12 items",
  },
  {
    id: "notepad",
    title: "Notepad",
    subtitle: "Plain text editor",
    icon: "./res/png/notepad-0.png",
    appId: "notepad",
    kind: "Application",
    size: "42 KB",
  },
  {
    id: "browser",
    title: "Internet Explorer",
    subtitle: "Browse the web",
    icon: "./res/png/msie1-0.png",
    appId: "browser",
    kind: "Application",
    size: "1.7 MB",
  },
  {
    id: "virtual-machine",
    title: "Virtual Machine",
    subtitle: "Run another desktop session",
    icon: "./res/png/computer_2-0.png",
    appId: "virtual-machine",
    kind: "Application",
    size: "4.0 MB",
  },
  {
    id: "contact",
    title: "Contact",
    subtitle: "Email and links",
    icon: "./res/png/message_envelope_open-0.png",
    appId: "contact",
    kind: "Folder",
    size: "3 items",
  },
  {
    id: "recycle-bin",
    title: "Recycle Bin",
    subtitle: "Deleted desktop items",
    icon: "./res/png/recycle_bin_empty-0.png",
    appId: "recycle-bin",
    kind: "System Folder",
    size: "0 items",
  },
];

function getItem(itemId) {
  return COMPUTER_ITEMS.find((item) => item.id === itemId) ?? null;
}

function getRecycleBinMeta(item, system) {
  if (item.id !== "recycle-bin") {
    return item;
  }

  const count = system?.recycleBinItems?.length ?? 0;

  return {
    ...item,
    icon: count > 0 ? "./res/png/recycle_bin_full-0.png" : "./res/png/recycle_bin_empty-0.png",
    size: `${count} item${count === 1 ? "" : "s"}`,
  };
}

function renderItem(item, selectedItemId, system) {
  const resolvedItem = getRecycleBinMeta(item, system);
  const isSelected = selectedItemId === item.id;

  return `
    <button
      class="my-computer-app__item ${isSelected ? "my-computer-app__item--selected" : ""}"
      type="button"
      data-my-computer-item="${item.id}"
      aria-pressed="${String(isSelected)}"
    >
      <span class="my-computer-app__item-name">
        <img class="my-computer-app__item-icon" src="${resolvedItem.icon}" alt="" width="32" height="32">
        <span class="my-computer-app__item-copy">
          <span class="my-computer-app__item-title">${resolvedItem.title}</span>
          <span class="my-computer-app__item-subtitle">${resolvedItem.subtitle}</span>
        </span>
      </span>
      <span class="my-computer-app__item-kind">${resolvedItem.kind}</span>
      <span class="my-computer-app__item-size">${resolvedItem.size}</span>
    </button>
  `;
}

function renderItems(selectedItemId, system) {
  return COMPUTER_ITEMS.map((item) => renderItem(item, selectedItemId, system)).join("");
}

function openSelectedItem(windowItem, windowManager) {
  const selectedItem = getItem(windowItem.data.selectedItemId);
  if (!selectedItem || !windowManager.hasApp(selectedItem.appId)) {
    return false;
  }

  windowManager.openWindow(selectedItem.appId);
  return true;
}

function getSelectedMeta(windowItem, system) {
  return getRecycleBinMeta(getItem(windowItem.data.selectedItemId) ?? COMPUTER_ITEMS[0], system);
}

export const myComputerApp = {
  id: "my-computer",
  title: "My Computer",
  icon: "./res/png/computer_explorer-0.png",
  defaultSize: {
    width: 640,
    height: 420,
  },
  minSize: {
    width: 456,
    height: 300,
  },
  defaultPosition: {
    x: 106,
    y: 86,
  },
  createState() {
    return {
      selectedItemId: "drive-c",
      isPropertiesOpen: false,
    };
  },
  render(windowItem, system) {
    const selectedItem = getSelectedMeta(windowItem, system);
    const selectedTitle = selectedItem.title;

    return `
      <div class="my-computer-app" data-my-computer-window="${windowItem.id}">
        <div class="my-computer-app__toolbar">
          <button class="win95-button my-computer-app__toolbar-button" type="button" data-my-computer-action="open">
            <img class="my-computer-app__toolbar-icon" src="./res/png/directory_open_cool-0.png" alt="" width="18" height="18">
            <span>Open</span>
          </button>
          <button class="win95-button my-computer-app__toolbar-button" type="button" data-my-computer-action="properties">
            <img class="my-computer-app__toolbar-icon" src="./res/png/settings_gear-0.png" alt="" width="18" height="18">
            <span>Properties</span>
          </button>
        </div>
        <div class="my-computer-app__address">
          <span class="my-computer-app__address-label">Address</span>
          <span class="my-computer-app__address-value">My Computer\\${selectedTitle}</span>
        </div>
        <div class="my-computer-app__header" aria-hidden="true">
          <span>Name</span>
          <span>Type</span>
          <span>Size</span>
        </div>
        <div class="my-computer-app__items" data-my-computer-items>
          ${renderItems(windowItem.data.selectedItemId, system)}
        </div>
        <div class="my-computer-app__status" data-my-computer-status>
          ${COMPUTER_ITEMS.length} object${COMPUTER_ITEMS.length === 1 ? "" : "s"} selected: ${selectedTitle}
        </div>
        <div
          class="my-computer-app__dialog-layer ${windowItem.data.isPropertiesOpen ? "" : "my-computer-app__dialog-layer--hidden"}"
          data-my-computer-properties
          aria-hidden="${String(!windowItem.data.isPropertiesOpen)}"
        >
          <section class="my-computer-app__dialog win95-panel" role="dialog" aria-modal="true" aria-labelledby="my-computer-properties-title-${windowItem.id}">
            <div class="my-computer-app__dialog-body">
              <img class="my-computer-app__dialog-icon" src="${selectedItem.icon}" alt="" width="32" height="32" data-my-computer-property-icon>
              <div class="my-computer-app__dialog-copy">
                <h2 id="my-computer-properties-title-${windowItem.id}" class="my-computer-app__dialog-title" data-my-computer-property-title>${selectedItem.title}</h2>
                <dl class="my-computer-app__properties-list">
                  <div class="my-computer-app__property-row">
                    <dt>Type:</dt>
                    <dd data-my-computer-property-kind>${selectedItem.kind}</dd>
                  </div>
                  <div class="my-computer-app__property-row">
                    <dt>Location:</dt>
                    <dd>My Computer</dd>
                  </div>
                  <div class="my-computer-app__property-row">
                    <dt>Size:</dt>
                    <dd data-my-computer-property-size>${selectedItem.size}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <div class="my-computer-app__dialog-actions">
              <button class="win95-button" type="button" data-my-computer-properties-close>OK</button>
            </div>
          </section>
        </div>
      </div>
    `;
  },
  sync(element, windowItem, windowManager, system) {
    const root = element.querySelector(`[data-my-computer-window="${windowItem.id}"]`);
    if (!root) {
      return;
    }

    const items = root.querySelector("[data-my-computer-items]");
    if (items) {
      items.innerHTML = renderItems(windowItem.data.selectedItemId, system);
    }

    const selectedItem = getSelectedMeta(windowItem, system);
    const selectedTitle = selectedItem.title;
    const address = root.querySelector(".my-computer-app__address-value");
    if (address) {
      address.textContent = `My Computer\\${selectedTitle}`;
    }

    const status = root.querySelector("[data-my-computer-status]");
    if (status) {
      status.textContent = `${COMPUTER_ITEMS.length} objects selected: ${selectedTitle}`;
    }

    const propertiesLayer = root.querySelector("[data-my-computer-properties]");
    if (propertiesLayer) {
      propertiesLayer.classList.toggle("my-computer-app__dialog-layer--hidden", !windowItem.data.isPropertiesOpen);
      propertiesLayer.setAttribute("aria-hidden", String(!windowItem.data.isPropertiesOpen));
    }

    const propertyIcon = root.querySelector("[data-my-computer-property-icon]");
    if (propertyIcon) {
      propertyIcon.src = selectedItem.icon;
    }

    const propertyTitle = root.querySelector("[data-my-computer-property-title]");
    if (propertyTitle) {
      propertyTitle.textContent = selectedItem.title;
    }

    const propertyKind = root.querySelector("[data-my-computer-property-kind]");
    if (propertyKind) {
      propertyKind.textContent = selectedItem.kind;
    }

    const propertySize = root.querySelector("[data-my-computer-property-size]");
    if (propertySize) {
      propertySize.textContent = selectedItem.size;
    }
  },
  handleEvent({ type, event, windowItem, windowManager }) {
    if (type === "click") {
      const closePropertiesButton = event.target.closest("[data-my-computer-properties-close]");
      if (closePropertiesButton) {
        windowItem.data.isPropertiesOpen = false;
        windowManager.syncAppWindow(windowItem.id);
        return true;
      }

      const actionButton = event.target.closest("[data-my-computer-action]");
      if (actionButton) {
        if (actionButton.dataset.myComputerAction === "open") {
          openSelectedItem(windowItem, windowManager);
          return true;
        }

        if (actionButton.dataset.myComputerAction === "properties") {
          windowItem.data.selectedItemId = windowItem.data.selectedItemId || "drive-c";
          windowItem.data.isPropertiesOpen = true;
          windowManager.syncAppWindow(windowItem.id);
          return true;
        }
      }

      const itemButton = event.target.closest("[data-my-computer-item]");
      if (!itemButton) {
        return false;
      }

      windowItem.data.selectedItemId = itemButton.dataset.myComputerItem;
      windowManager.syncAppWindow(windowItem.id);
      return true;
    }

    if (type === "dblclick") {
      const itemButton = event.target.closest("[data-my-computer-item]");
      if (!itemButton) {
        return false;
      }

      windowItem.data.selectedItemId = itemButton.dataset.myComputerItem;
      openSelectedItem(windowItem, windowManager);
      return true;
    }

    if (type === "keydown") {
      if (event.key !== "Enter") {
        return false;
      }

      event.preventDefault();
      return openSelectedItem(windowItem, windowManager);
    }

    return false;
  },
};
