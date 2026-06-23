import { browserApp } from "./components/browser.js";
import { contactApp } from "./components/contact.js";
import { documentsApp } from "./components/documents.js";
import { myComputerApp } from "./components/my-computer.js";
import { notepadApp } from "./components/notepad.js";
import { portfolioApp } from "./components/portfolio.js";
import { recycleBinApp } from "./components/recycle-bin.js";
import { shutdownApp } from "./components/shutdown.js";
import { virtualMachineApp } from "./components/virtual-machine.js";

export const apps = {
  [notepadApp.id]: notepadApp,
  [browserApp.id]: browserApp,
  [myComputerApp.id]: myComputerApp,
  [documentsApp.id]: documentsApp,
  [portfolioApp.id]: portfolioApp,
  [contactApp.id]: contactApp,
  [recycleBinApp.id]: recycleBinApp,
  [virtualMachineApp.id]: virtualMachineApp,
  [shutdownApp.id]: shutdownApp,
};
