export const documentsApp = {
  id: "documents",
  title: "Documents",
  icon: "./res/png/directory_open_file_mydocs_small-0.png",
  defaultSize: {
    width: 420,
    height: 280,
  },
  minSize: {
    width: 300,
    height: 220,
  },
  defaultPosition: {
    x: 116,
    y: 84,
  },
  render() {
    return `
      <div class="window-content">
        <h1 class="window-content__title">Documents</h1>
        <p>This is a good place for case studies, notes, writing samples, or downloadable assets.</p>
      </div>
    `;
  },
};
