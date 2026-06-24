import { browserApp } from "./components/browser.js";
import { aboutApp } from "./components/about.js";
import { documentsApp } from "./components/documents.js";
import { desktopBackgroundApp } from "./components/desktop-background.js";
import { myComputerApp } from "./components/my-computer.js";
import { notepadApp } from "./components/notepad.js";
import { paintApp } from "./components/paint.js";
import { projectsApp } from "./components/projects.js";
import { recycleBinApp } from "./components/recycle-bin.js";
import { shutdownApp } from "./components/shutdown.js";
import { virtualMachineApp } from "./components/virtual-machine.js";

export const apps = {
  [notepadApp.id]: notepadApp,
  [browserApp.id]: browserApp,
  [myComputerApp.id]: myComputerApp,
  [documentsApp.id]: documentsApp,
  [desktopBackgroundApp.id]: desktopBackgroundApp,
  [projectsApp.id]: projectsApp,
  [aboutApp.id]: aboutApp,
  [paintApp.id]: paintApp,
  [recycleBinApp.id]: recycleBinApp,
  [virtualMachineApp.id]: virtualMachineApp,
  [shutdownApp.id]: shutdownApp,
};
