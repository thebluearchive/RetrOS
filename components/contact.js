export const contactApp = {
  id: "contact",
  title: "Contact",
  icon: "./res/png/message_envelope_open-0.png",
  defaultSize: {
    width: 432,
    height: 264,
  },
  minSize: {
    width: 336,
    height: 216,
  },
  defaultPosition: {
    x: 158,
    y: 115,
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
};
