function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderItems(items, selectedItemIds) {
  return items
    .map((item) => {
      const isSelected = selectedItemIds.includes(item.id);

      return `
        <button
          class="recycle-bin-app__row ${isSelected ? "recycle-bin-app__row--selected" : ""}"
          type="button"
          data-recycle-bin-select="${item.id}"
          aria-pressed="${String(isSelected)}"
        >
          <span class="recycle-bin-app__cell recycle-bin-app__cell--name">
            <img class="recycle-bin-app__item-icon" src="${item.icon}" alt="" width="16" height="16">
            <span>${escapeHtml(item.title)}</span>
          </span>
          <span class="recycle-bin-app__cell recycle-bin-app__cell--type">Shortcut</span>
          <span class="recycle-bin-app__cell recycle-bin-app__cell--action">
            <span>${new Date(item.deletedAt).toLocaleDateString()}</span>
            <span class="recycle-bin-app__restore-label">Restore</span>
          </span>
        </button>
      `;
    })
    .join("");
}

export const recycleBinApp = {
  id: "recycle-bin",
  title: "Recycle Bin",
  icon: "./res/png/recycle_bin_empty-0.png",
  defaultSize: {
    width: 544,
    height: 360,
  },
  minSize: {
    width: 360,
    height: 240,
  },
  defaultPosition: {
    x: 185,
    y: 118,
  },
  createState() {
    return {
      selectedItemIds: [],
    };
  },
  render(windowItem, system) {
    const items = system?.recycleBinItems ?? [];
    const selectedItemIds = windowItem.data.selectedItemIds ?? [];
    const selectedCount = selectedItemIds.filter((itemId) =>
      items.some((item) => item.id === itemId)
    ).length;

    return `
      <div class="recycle-bin-app" data-recycle-bin-window="${windowItem.id}">
        <div class="recycle-bin-app__toolbar">
          <button
            class="win95-button recycle-bin-app__toolbar-button"
            type="button"
            data-recycle-bin-action="restore-selected"
            ${selectedCount === 0 ? "disabled" : ""}
          >
            Restore
          </button>
          <button
            class="win95-button recycle-bin-app__toolbar-button"
            type="button"
            data-recycle-bin-action="empty-bin"
            ${items.length === 0 ? "disabled" : ""}
          >
            Empty Recycle Bin
          </button>
          <span class="recycle-bin-app__status">${items.length} item${items.length === 1 ? "" : "s"}</span>
        </div>
        <div class="recycle-bin-app__header" aria-hidden="true">
          <span class="recycle-bin-app__cell recycle-bin-app__cell--name">Name</span>
          <span class="recycle-bin-app__cell recycle-bin-app__cell--type">Type</span>
          <span class="recycle-bin-app__cell recycle-bin-app__cell--action">Deleted</span>
        </div>
        <div class="recycle-bin-app__list" data-recycle-bin-list>
          ${
            items.length
              ? renderItems(items, selectedItemIds)
              : '<p class="recycle-bin-app__empty">The Recycle Bin is empty.</p>'
          }
        </div>
      </div>
    `;
  },
  sync(element, windowItem, windowManager, system) {
    const root = element.querySelector(`[data-recycle-bin-window="${windowItem.id}"]`);
    if (!root) {
      return;
    }

    const items = system?.recycleBinItems ?? [];
    const validIds = new Set(items.map((item) => item.id));
    windowItem.data.selectedItemIds = (windowItem.data.selectedItemIds ?? []).filter((itemId) =>
      validIds.has(itemId)
    );
    const selectedCount = windowItem.data.selectedItemIds.length;

    const restoreButton = root.querySelector('[data-recycle-bin-action="restore-selected"]');
    if (restoreButton) {
      restoreButton.disabled = selectedCount === 0;
    }

    const emptyButton = root.querySelector('[data-recycle-bin-action="empty-bin"]');
    if (emptyButton) {
      emptyButton.disabled = items.length === 0;
    }

    const status = root.querySelector(".recycle-bin-app__status");
    if (status) {
      status.textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;
    }

    const list = root.querySelector("[data-recycle-bin-list]");
    if (list) {
      list.innerHTML = items.length
        ? renderItems(items, windowItem.data.selectedItemIds)
        : '<p class="recycle-bin-app__empty">The Recycle Bin is empty.</p>';
    }
  },
  handleEvent({ type, event, windowItem, system, windowManager }) {
    if (type !== "click") {
      return false;
    }

    const actionButton = event.target.closest("[data-recycle-bin-action]");
    if (actionButton) {
      if (actionButton.dataset.recycleBinAction === "restore-selected") {
        const selectedItemIds = windowItem.data.selectedItemIds ?? [];
        if (selectedItemIds.length > 0) {
          system.restoreRecycleBinItems(selectedItemIds);
          windowItem.data.selectedItemIds = [];
          windowManager.syncAppWindow(windowItem.id);
        }
        return true;
      }

      if (actionButton.dataset.recycleBinAction === "empty-bin") {
        if ((system.recycleBinItems ?? []).length === 0) {
          return true;
        }

        system.emptyRecycleBin();
        windowItem.data.selectedItemIds = [];
        windowManager.syncAppWindow(windowItem.id);
        return true;
      }
    }

    const itemButton = event.target.closest("[data-recycle-bin-select]");
    if (!itemButton) {
      return false;
    }

    const { recycleBinSelect: itemId } = itemButton.dataset;
    const currentIds = new Set(windowItem.data.selectedItemIds ?? []);

    if (event.detail >= 2) {
      system.restoreRecycleBinItems([itemId]);
      windowItem.data.selectedItemIds = [];
      windowManager.syncAppWindow(windowItem.id);
      return true;
    }

    if (currentIds.has(itemId)) {
      currentIds.delete(itemId);
    } else {
      currentIds.clear();
      currentIds.add(itemId);
    }

    windowItem.data.selectedItemIds = Array.from(currentIds);
    windowManager.syncAppWindow(windowItem.id);
    return true;
  },
};
