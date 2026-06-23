export const aboutApp = {
  id: "about",
  title: "About",
  icon: "./res/png/help_book_cool-0.png",
  defaultSize: {
    width: 504,
    height: 318,
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
      <div class="about-app">
        <div class="about-app__header">
          <img class="about-app__icon" src="./res/png/help_book_cool-0.png" alt="" width="40" height="40">
          <div class="about-app__title-group">
            <h1 class="about-app__title">About This Desktop</h1>
            <p class="about-app__subtitle">A Retro Desktop Exploration Project.</p>
          </div>
        </div>
        <div class="about-app__body">
          <p>
            This project is an ode to old operating systems and simpler computing environments, an era I am nostalgic for despite being (somewhat) before my time.
            My earliest OS was Windows XP, but the aesthetic of this project is inspired by Windows 95.
          </p>
          <p>
            My goal in creating this is to explore the capabilities of modern web browsers by recreating this classic desktop environment feel.
          </p>
          <p>
          For source code and more, visit
          <a class="about-app__link" href="https://github.com/thebluearchive" target="_blank" rel="noopener noreferrer">
            https://github.com/thebluearchive
          </a>
          </p>
        </div>
      </div>
    `;
  },
};
