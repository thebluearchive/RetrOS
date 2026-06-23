export const portfolioApp = {
  id: "portfolio",
  title: "Portfolio",
  icon: "./res/png/briefcase-0.png",
  defaultSize: {
    width: 504,
    height: 360,
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
};
