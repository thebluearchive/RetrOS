import { getDocumentWallpaperItems, renderPaintFileToDataUrl } from "./documents.js";

const fallbackColor = "#008080";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallbackColor;
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function getCurrentBackground(system) {
  return system?.desktopBackground ?? {
    type: "color",
    color: fallbackColor,
    image: null,
    sourceId: null,
    sourceName: null,
  };
}

function renderDocumentChoices(currentBackground) {
  return getDocumentWallpaperItems()
    .map((item) => {
      const isSelected =
        currentBackground.type === "document-image" && currentBackground.sourceId === item.id;

      return `
        <button
          class="background-app__doc-button ${isSelected ? "background-app__doc-button--selected" : ""}"
          type="button"
          data-background-doc-id="${escapeHtml(item.id)}"
          aria-pressed="${String(isSelected)}"
        >
          <img class="background-app__doc-icon" src="${item.icon}" alt="" width="24" height="24">
          <span>${escapeHtml(item.title)}</span>
        </button>
      `;
    })
    .join("");
}

export const desktopBackgroundApp = {
  id: "desktop-background",
  title: "Desktop Background",
  icon: "./res/png/display_properties-0.png",
  defaultSize: {
    width: 512,
    height: 398,
  },
  minSize: {
    width: 440,
    height: 344,
  },
  defaultPosition: {
    x: 156,
    y: 96,
  },
  createState() {
    return {
      error: "",
    };
  },
  render(windowItem, system) {
    const background = getCurrentBackground(system);
    const color = normalizeColor(background.color);
    const previewStyle =
      background.type === "color"
        ? `background-color: ${color};`
        : `background-color: ${color}; background-image: url("${background.image}");`;

    return `
      <div class="background-app" data-background-window="${windowItem.id}">
        <section class="background-app__preview-panel" aria-label="Desktop preview">
          <div class="background-app__monitor">
            <div class="background-app__preview" style="${previewStyle}"></div>
          </div>
          <div class="background-app__current">
            <span>Current:</span>
            <strong>${escapeHtml(background.sourceName ?? (background.type === "color" ? "Solid color" : "Image"))}</strong>
          </div>
        </section>

        <section class="background-app__section" aria-label="Solid color">
          <h2 class="background-app__heading">Solid color</h2>
          <div class="background-app__color-row">
            <input class="background-app__color-input" type="color" value="${color}" data-background-color>
            <input class="background-app__text-input" type="text" value="${color}" maxlength="7" spellcheck="false" data-background-color-text>
            <button class="win95-button background-app__button" type="button" data-background-action="set-color">Apply</button>
          </div>
        </section>

        <section class="background-app__section" aria-label="Document images">
          <h2 class="background-app__heading">Images in Documents</h2>
          <div class="background-app__doc-list">
            ${renderDocumentChoices(background)}
          </div>
        </section>

        <section class="background-app__section" aria-label="Upload image">
          <h2 class="background-app__heading">Uploaded image</h2>
          <label class="win95-button background-app__upload-button">
            <span>Choose Image...</span>
            <input class="background-app__file-input" type="file" accept="image/*" data-background-upload>
          </label>
          <p class="background-app__error" data-background-error>${escapeHtml(windowItem.data.error)}</p>
        </section>
      </div>
    `;
  },
  sync(element, windowItem, windowManager, system) {
    const root = element.querySelector(`[data-background-window="${windowItem.id}"]`);
    if (!root) {
      return;
    }

    root.outerHTML = this.render(windowItem, system);
  },
  async handleEvent({ type, event, windowItem, windowManager, system }) {
    if (type === "input") {
      const colorInput = event.target.closest("[data-background-color]");
      if (colorInput) {
        const root = event.target.closest("[data-background-window]");
        const textInput = root?.querySelector("[data-background-color-text]");
        if (textInput) {
          textInput.value = colorInput.value;
        }
        return true;
      }

      return false;
    }

    if (type === "click") {
      const actionButton = event.target.closest("[data-background-action]");
      if (actionButton?.dataset.backgroundAction === "set-color") {
        const root = event.target.closest("[data-background-window]");
        const textInput = root?.querySelector("[data-background-color-text]");
        const colorInput = root?.querySelector("[data-background-color]");
        const color = normalizeColor(textInput?.value || colorInput?.value);

        system.setDesktopBackground({
          type: "color",
          color,
          image: null,
          sourceId: null,
          sourceName: "Solid color",
        });
        windowItem.data.error = "";
        windowManager.syncAppWindow(windowItem.id);
        return true;
      }

      const docButton = event.target.closest("[data-background-doc-id]");
      if (docButton) {
        const doc = getDocumentWallpaperItems().find((item) => item.id === docButton.dataset.backgroundDocId);
        if (!doc) {
          return false;
        }

        system.setDesktopBackground({
          type: "document-image",
          color: doc.paintFile.background ?? fallbackColor,
          image: renderPaintFileToDataUrl(doc.paintFile),
          sourceId: doc.id,
          sourceName: doc.title,
        });
        windowItem.data.error = "";
        windowManager.syncAppWindow(windowItem.id);
        return true;
      }

      return false;
    }

    if (type === "change") {
      const uploadInput = event.target.closest("[data-background-upload]");
      const file = uploadInput?.files?.[0];
      if (!uploadInput || !file) {
        return false;
      }

      if (!file.type.startsWith("image/")) {
        windowItem.data.error = "Please choose an image file.";
        windowManager.syncAppWindow(windowItem.id);
        return true;
      }

      try {
        const dataUrl = await readImageFile(file);
        system.setDesktopBackground({
          type: "uploaded-image",
          color: fallbackColor,
          image: dataUrl,
          sourceId: null,
          sourceName: file.name,
        });
        windowItem.data.error = "";
      } catch {
        windowItem.data.error = "The image could not be loaded.";
      }

      windowManager.syncAppWindow(windowItem.id);
      return true;
    }

    return false;
  },
};
