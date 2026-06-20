export const recycleBinApp = {
  id: "recycle-bin",
  title: "Recycle Bin",
  icon: "./res/png/recycle_bin_empty-0.png",
  defaultSize: {
    width: 320,
    height: 220,
  },
  minSize: {
    width: 260,
    height: 180,
  },
  defaultPosition: {
    x: 164,
    y: 120,
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
