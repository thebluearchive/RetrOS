export const apps = {
  browser: {
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
              <button class="browser-app__nav-button win95-button" type="button" data-browser-action="back" data-window-id="${windowItem.id}" ${canGoBack ? "" : "disabled"}>Back</button>
              <button class="browser-app__nav-button win95-button" type="button" data-browser-action="forward" data-window-id="${windowItem.id}" ${canGoForward ? "" : "disabled"}>Forward</button>
              <button class="browser-app__nav-button win95-button" type="button" data-browser-action="home" data-window-id="${windowItem.id}">Home</button>
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
  },
  portfolio: {
    id: "portfolio",
    title: "Portfolio",
    icon: "./res/png/briefcase-0.png",
    defaultSize: {
      width: 420,
      height: 300,
    },
    minSize: {
      width: 300,
      height: 220,
    },
    defaultPosition: {
      x: 72,
      y: 56,
    },
    render() {
      return `
        <div class="window-content">
          <h1 class="window-content__title">Portfolio.exe</h1>
          <p>This window will hold featured projects, selected case studies, and a short summary of your work.</p>
          <ul class="window-content__list">
            <li>Featured builds</li>
            <li>Technical strengths</li>
            <li>Links to live work</li>
          </ul>
        </div>
      `;
    },
  },
  contact: {
    id: "contact",
    title: "Contact",
    icon: "./res/png/message_envelope_open-0.png",
    defaultSize: {
      width: 360,
      height: 220,
    },
    minSize: {
      width: 280,
      height: 180,
    },
    defaultPosition: {
      x: 132,
      y: 96,
    },
    render() {
      return `
        <div class="window-content">
          <h1 class="window-content__title">Contact</h1>
          <p>Add your email, GitHub, LinkedIn, and preferred contact method here.</p>
          <ul class="window-content__list">
            <li>you@example.com</li>
            <li>github.com/yourname</li>
            <li>linkedin.com/in/yourname</li>
          </ul>
        </div>
      `;
    },
  },
};
