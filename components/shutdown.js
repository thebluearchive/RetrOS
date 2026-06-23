export const shutdownApp = {
  id: "shutdown",
  title: "Shut Down Windows",
  icon: "./res/png/shut_down_normal-0.png",
  defaultSize: {
    width: 480,
    height: 257,
  },
  minSize: {
    width: 480,
    height: 257,
  },
  defaultPosition: {
    x: 134,
    y: 106,
  },
  render(windowItem) {
    const shutdownId = `shutdown-choice-${windowItem.id}`;
    const restartId = `restart-choice-${windowItem.id}`;
    const choice = windowItem.data.choice === "restart" ? "restart" : "shutdown";

    return `
      <div class="shutdown-app" data-shutdown-window="${windowItem.id}">
        <div class="shutdown-app__body">
          <img
            class="shutdown-app__icon"
            src="./res/png/shut_down_normal-0.png"
            alt=""
            width="32"
            height="32"
          >
          <div class="shutdown-app__content">
            <p class="shutdown-app__prompt">Are you sure you want to:</p>
            <div class="shutdown-app__options" role="radiogroup" aria-label="Shutdown options">
              <label class="shutdown-app__option" for="${shutdownId}">
                <input
                  id="${shutdownId}"
                  class="shutdown-app__radio"
                  type="radio"
                  name="shutdown-choice-${windowItem.id}"
                  value="shutdown"
                  data-shutdown-choice
                  ${choice === "shutdown" ? "checked" : ""}
                >
                <span>Shut down the computer?</span>
              </label>
              <label class="shutdown-app__option" for="${restartId}">
                <input
                  id="${restartId}"
                  class="shutdown-app__radio"
                  type="radio"
                  name="shutdown-choice-${windowItem.id}"
                  value="restart"
                  data-shutdown-choice
                  ${choice === "restart" ? "checked" : ""}
                >
                <span>Restart the computer?</span>
              </label>
            </div>
          </div>
        </div>
        <div class="shutdown-app__actions">
          <button class="win95-button shutdown-app__button" type="button" data-shutdown-action="confirm">
            Yes
          </button>
          <button class="win95-button shutdown-app__button" type="button" data-shutdown-action="cancel">
            No
          </button>
        </div>
      </div>
    `;
  },
  createState() {
    return {
      choice: "shutdown",
    };
  },
  handleEvent({ type, event, windowItem }) {
    if (type === "input") {
      const radio = event.target.closest("[data-shutdown-choice]");
      if (!radio) {
        return false;
      }

      windowItem.data.choice = radio.value === "restart" ? "restart" : "shutdown";
      return true;
    }

    if (type !== "click") {
      return false;
    }

    const actionButton = event.target.closest("[data-shutdown-action]");
    if (!actionButton) {
      return false;
    }

    const { shutdownAction } = actionButton.dataset;

    if (shutdownAction === "cancel") {
      document.dispatchEvent(
        new CustomEvent("win95:window-action", {
          detail: {
            action: "close",
            windowId: windowItem.id,
          },
        }),
      );
      return true;
    }

    if (shutdownAction === "confirm") {
      const choice = windowItem.data.choice === "restart" ? "restart" : "shutdown";

      document.dispatchEvent(
        new CustomEvent("win95:shutdown", {
          detail: {
            action: choice,
            windowId: windowItem.id,
          },
        }),
      );
      return true;
    }

    return false;
  },
};
