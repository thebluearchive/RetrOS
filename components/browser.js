function navigate(windowItem, url, windowManager) {
  if (windowItem.data.url === url) {
    return;
  }

  windowItem.data.backStack.push(windowItem.data.url);
  windowItem.data.forwardStack = [];
  windowItem.data.url = url;
  windowManager.syncAppWindow(windowItem.id);
}

export const browserApp = {
  id: "browser",
  title: "Internet Explorer",
  icon: "./res/png/msie1-0.png",
  defaultSize: {
    width: 720,
    height: 500,
  },
  minSize: {
    width: 420,
    height: 320,
  },
  defaultPosition: {
    x: 48,
    y: 32,
  },
  createState() {
    return {
      homeUrl: "https://en.wikipedia.org/wiki/Internet_Explorer",
      url: "https://en.wikipedia.org/wiki/Internet_Explorer",
      backStack: [],
      forwardStack: [],
    };
  },
  render(windowItem) {
    const url = windowItem.data.url;
    const canGoBack = windowItem.data.backStack.length > 0;
    const canGoForward = windowItem.data.forwardStack.length > 0;

    return `
      <div class="browser-app browser-app--ie" data-browser-window="${windowItem.id}">
        <form class="browser-app__toolbar" data-browser-form="${windowItem.id}">
          <div class="browser-app__nav browser-app__nav--top">
            <button class="browser-app__nav-button browser-app__nav-button--toolbar win95-button" type="button" data-browser-action="back" data-window-id="${windowItem.id}" aria-label="Back" ${canGoBack ? "" : "disabled"}>
              <span class="browser-app__nav-icon browser-app__nav-icon--back" aria-hidden="true">
                <span class="browser-app__arrow browser-app__arrow--back"></span>
              </span>
              <span class="browser-app__nav-label">Back</span>
              <span class="browser-app__nav-caret" aria-hidden="true"></span>
            </button>
            <span class="browser-app__toolbar-divider" aria-hidden="true"></span>
            <button class="browser-app__nav-button browser-app__nav-button--toolbar win95-button" type="button" data-browser-action="forward" data-window-id="${windowItem.id}" aria-label="Forward" ${canGoForward ? "" : "disabled"}>
              <span class="browser-app__nav-icon browser-app__nav-icon--forward" aria-hidden="true">
                <span class="browser-app__arrow browser-app__arrow--forward"></span>
              </span>
              <span class="browser-app__nav-label">Forward</span>
              <span class="browser-app__nav-caret" aria-hidden="true"></span>
            </button>
            <span class="browser-app__toolbar-divider" aria-hidden="true"></span>
            <button class="browser-app__nav-button browser-app__nav-button--toolbar win95-button" type="button" data-browser-action="refresh" data-window-id="${windowItem.id}" aria-label="Refresh">
              <img class="browser-app__toolbar-icon" src="./res/png/windows_update_old-0.png" alt="" width="20" height="20">
              <span class="browser-app__nav-label">Refresh</span>
            </button>
            <span class="browser-app__toolbar-divider" aria-hidden="true"></span>
            <button class="browser-app__nav-button browser-app__nav-button--toolbar win95-button" type="button" data-browser-action="home" data-window-id="${windowItem.id}" aria-label="Home">
              <img class="browser-app__toolbar-icon" src="./res/png/homepage-0.png" alt="" width="20" height="20">
              <span class="browser-app__nav-label">Home</span>
            </button>
          </div>
          <div class="browser-app__address-row">
            <label class="browser-app__label" for="browser-url-${windowItem.id}">Address</label>
            <input
              id="browser-url-${windowItem.id}"
              class="browser-app__input"
              name="url"
              type="text"
              value="${url}"
              autocomplete="off"
              spellcheck="false"
            >
            <button class="browser-app__button win95-button" type="submit">Go</button>
          </div>
        </form>
        <div class="browser-app__viewport">
          <iframe
            class="browser-app__frame"
            title="Embedded web browser"
            src="${url}"
            loading="eager"
            referrerpolicy="strict-origin-when-cross-origin"
          ></iframe>
        </div>
      </div>
    `;
  },
  sync(element, windowItem) {
    const browserRoot = element.querySelector(`[data-browser-window="${windowItem.id}"]`);
    if (!browserRoot) {
      return;
    }

    const input = browserRoot.querySelector(".browser-app__input");
    const frame = browserRoot.querySelector(".browser-app__frame");
    const backButton = browserRoot.querySelector('[data-browser-action="back"]');
    const forwardButton = browserRoot.querySelector('[data-browser-action="forward"]');
    const url = windowItem.data.url;

    if (input && document.activeElement !== input && input.value !== url) {
      input.value = url;
    }

    if (frame && frame.getAttribute("src") !== url) {
      frame.setAttribute("src", url);
    }

    if (backButton) {
      backButton.disabled = windowItem.data.backStack.length === 0;
    }

    if (forwardButton) {
      forwardButton.disabled = windowItem.data.forwardStack.length === 0;
    }
  },
  handleEvent({ type, event, windowItem, windowManager }) {
    if (type === "click") {
      const browserActionButton = event.target.closest("[data-browser-action]");
      if (!browserActionButton) {
        return false;
      }

      const { browserAction } = browserActionButton.dataset;

      if (browserAction === "back") {
        if (windowItem.data.backStack.length === 0) {
          return true;
        }

        windowItem.data.forwardStack.push(windowItem.data.url);
        windowItem.data.url = windowItem.data.backStack.pop();
        windowManager.syncAppWindow(windowItem.id);
        return true;
      }

      if (browserAction === "forward") {
        if (windowItem.data.forwardStack.length === 0) {
          return true;
        }

        windowItem.data.backStack.push(windowItem.data.url);
        windowItem.data.url = windowItem.data.forwardStack.pop();
        windowManager.syncAppWindow(windowItem.id);
        return true;
      }

      if (browserAction === "home") {
        navigate(windowItem, windowItem.data.homeUrl, windowManager);
        return true;
      }

      if (browserAction === "refresh") {
        const frame = windowManager.getWindowElement(windowItem.id)?.querySelector(".browser-app__frame");
        if (frame) {
          frame.setAttribute("src", windowItem.data.url);
        }
        return true;
      }

      return false;
    }

    if (type === "submit") {
      const form = event.target.closest("[data-browser-form]");
      if (!form) {
        return false;
      }

      event.preventDefault();

      const formData = new FormData(form);
      const url = windowManager.normalizeUrl(formData.get("url"));

      if (!url) {
        return true;
      }

      navigate(windowItem, url, windowManager);
      return true;
    }

    return false;
  },
};
