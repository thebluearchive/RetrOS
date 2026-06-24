const PROJECTS = [
  {
    title: "RetrOS",
    description: "The current Windows 95-style desktop project.",
    pageUrl: "https://github.com/thebluearchive/RetrOS",
    sourceUrl: "https://github.com/thebluearchive/RetrOS",
    icon: "./res/png/computer_2-0.png",
    openExternally: true,
  },
  {
    title: "blog",
    description: "A publishing project from The Blue Archive.",
    pageUrl: "https://thebluearchive.github.io/blog/",
    sourceUrl: "https://github.com/thebluearchive/blog",
    icon: "./res/png/html-0.png",
  },
  {
    title: "slotted-page",
    description: "A slotted page storage implementation.",
    pageUrl: "https://thebluearchive.github.io/slotted-page/",
    sourceUrl: "https://github.com/thebluearchive/slotted-page",
    icon: "./res/png/script_file_blue-0.png",
  },
];

function renderProject(project, index) {
  return `
    <button class="projects-app__item" type="button" data-project-index="${index}">
      <img class="projects-app__icon" src="${project.icon}" alt="" width="32" height="32">
      <span class="projects-app__copy">
        <span class="projects-app__title">${project.title}</span>
        <span class="projects-app__description">${project.description}</span>
        <span class="projects-app__url">${project.pageUrl}</span>
        <span class="projects-app__source">Source: ${project.sourceUrl}</span>
      </span>
    </button>
  `;
}

function openProjectInBrowser(project, windowManager) {
  const browserWindow = windowManager.openWindow("browser");
  if (!browserWindow) {
    return false;
  }

  if (browserWindow.data.url !== project.pageUrl) {
    browserWindow.data.backStack.push(browserWindow.data.url);
    browserWindow.data.forwardStack = [];
    browserWindow.data.url = project.pageUrl;
  }

  windowManager.syncAppWindow(browserWindow.id);
  return true;
}

function openProject(project, windowManager) {
  if (project.openExternally) {
    window.open(project.pageUrl, "_blank", "noopener,noreferrer");
    return true;
  }

  return openProjectInBrowser(project, windowManager);
}

export const projectsApp = {
  id: "projects",
  title: "Projects",
  icon: "./res/png/briefcase-0.png",
  defaultSize: {
    width: 700,
    height: 500,
  },
  minSize: {
    width: 360,
    height: 264,
  },
  defaultPosition: {
    x: 86,
    y: 67,
  },
  render() {
    return `
      <div class="projects-app">
        <div class="projects-app__address">
          <span class="projects-app__address-label">Address</span>
          <span class="projects-app__address-value">C:\\Projects</span>
        </div>
        <div class="projects-app__list" aria-label="Projects">
          ${PROJECTS.map(renderProject).join("")}
        </div>
        <div class="projects-app__status">${PROJECTS.length} object${PROJECTS.length === 1 ? "" : "s"}</div>
      </div>
    `;
  },
  handleEvent({ type, event, windowManager }) {
    if (type !== "click") {
      return false;
    }

    const projectButton = event.target.closest("[data-project-index]");
    if (!projectButton) {
      return false;
    }

    const project = PROJECTS[Number(projectButton.dataset.projectIndex)];
    if (!project) {
      return true;
    }

    return openProject(project, windowManager);
  },
};
