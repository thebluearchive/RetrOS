export const recycleBinApp = {
  id: "recycle-bin",
  title: "Recycle Bin",
  icon: "./res/png/recycle_bin_empty-0.png",
  defaultSize: {
    width: 384,
    height: 264,
  },
  minSize: {
    width: 312,
    height: 216,
  },
  defaultPosition: {
    x: 197,
    y: 144,
  },
  render() {
    return `
      <div class="window-content">
        <h1 class="window-content__title">Recycle Bin</h1>
        <p>Nothing to see here yet.</p>
      </div>
    `;
  },
};
