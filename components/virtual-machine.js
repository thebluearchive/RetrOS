function getVirtualMachineDepth() {
  const params = new URLSearchParams(window.location.search);
  return Number.parseInt(params.get("vm") ?? "0", 10) || 0;
}

function getVirtualMachineUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("vm", String(getVirtualMachineDepth() + 1));
  return url.pathname + url.search + url.hash;
}

export const virtualMachineApp = {
  id: "virtual-machine",
  title: "Virtual Machine",
  icon: "./res/png/computer_2-0.png",
  defaultSize: {
    width: 720,
    height: 520,
  },
  minSize: {
    width: 480,
    height: 340,
  },
  defaultPosition: {
    x: 64,
    y: 52,
  },
  render() {
    const depth = getVirtualMachineDepth() + 1;
    const src = getVirtualMachineUrl();

    return `
      <div class="virtual-machine-app">
        <div class="virtual-machine-app__toolbar">
          <span class="virtual-machine-app__indicator" aria-hidden="true"></span>
          <span class="virtual-machine-app__label">Running nested desktop session ${depth}</span>
        </div>
        <div class="virtual-machine-app__viewport">
          <iframe
            class="virtual-machine-app__frame"
            src="${src}"
            title="Nested virtual machine desktop"
          ></iframe>
        </div>
      </div>
    `;
  },
};
