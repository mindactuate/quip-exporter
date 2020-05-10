import { store } from "react-easy-state";

let globalStore = store({
  log: [],
  addToLog: string => {
    globalStore.log.unshift(`${new Date().toLocaleString()}: ${string}`);
  },
  clearLog: () => {
    globalStore.log = [];
  },
  quipToken: "",
  zipFile: null,
  rootDir: null,
  exportPaused: false,
  donated: false,
  running: false,
    finished: false,
  numAPIcalls: 0
});

export default globalStore;
