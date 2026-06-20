export const apps = {
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
