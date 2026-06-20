export const myComputerApp = {
  id: "my-computer",
  title: "My Computer",
  icon: "./res/png/computer_explorer-0.png",
  defaultSize: {
    width: 460,
    height: 320,
  },
  minSize: {
    width: 320,
    height: 220,
  },
  defaultPosition: {
    x: 88,
    y: 72,
  },
  render() {
    return `
      <div class="window-content">
        <h1 class="window-content__title">My Computer</h1>
        <p>This can become the main overview window for your portfolio machine.</p>
        <ul class="window-content__list">
          <li>About Me</li>
          <li>Projects</li>
          <li>Resume</li>
        </ul>
      </div>
    `;
  },
};
