export const documentsApp = {
  id: "documents",
  title: "Documents",
  icon: "./res/png/directory_open_file_mydocs_small-0.png",
  defaultSize: {
    width: 504,
    height: 336,
  },
  minSize: {
    width: 360,
    height: 264,
  },
  defaultPosition: {
    x: 139,
    y: 101,
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
