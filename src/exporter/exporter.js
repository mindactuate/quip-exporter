import globalStore from "../globalStore";
import axios from "axios";
import turndown from "turndown";
import jszip from "jszip";

// https://quip.com/api/personal-token

const patiently = require("patiently");
// const fs = require("file-system");
// const Path = require("path");
const config = require("../config");

let mdService = new turndown();
let zipService = new jszip();

let waiter = new patiently.LimitWaiter({
  startWaitingCallback: (res) => console.log(res),
  endWaitingCallback: (res) => console.log(res),
  waitingTickCallback: (res) => console.log(res),
  minutelyLimit: 50,
  hourlyLimit: 750,
  msBetweenTwoCalls: 0,
  test: false,
});

let d = new Date();
let rootDir = clean(d.toLocaleString());
var path = [rootDir];
let numAPICallsToPause = 100;

export let startExporting = function (quipToken) {
  if (quipToken) {
    globalStore.running = true;
    globalStore.quipToken = quipToken; // "cache" quip token
    globalStore.addToLog(`Got access token: ${quipToken}`);
    globalStore.addToLog(`Start exporting`);
    getUser((user) => {
      let sharedFolderIds = user["shared_folder_ids"];
      let sharedFolderChildren = [];
      if (Array.isArray(sharedFolderIds)) {
        sharedFolderIds.forEach((folderId) => {
          sharedFolderChildren.push({ folder_id: folderId });
        });
      }
      let sharedFolder = {
        children: sharedFolderChildren,
        folder: {
          id: "12345",
          title: "Shared",
        },
      };
      getFolder(user["private_folder_id"], (privateFolder) => {
        console.log("loop over private folder docs");
        waterfallOverFolder(privateFolder, processObj, function (tree) {
          console.log("In queue:", waiter.callbackQueue.length);
          console.log("loop over shared folders");
          waterfallOverFolder(sharedFolder, processObj, function (tree) {
            globalStore.addToLog("Finished exporting");
            globalStore.addToLog("Used " + waiter.totalC + " api calls");
            globalStore.addToLog("Creating zip file");

            setTimeout(() => {
              zipService.generateAsync({ type: "blob" }).then(function (blob) {
                globalStore.addToLog(`Zip file ${rootDir} created`);
                globalStore.zipFile = blob;
                globalStore.rootDir = rootDir;
                globalStore.finished = true;
                globalStore.running = false;
              });
            }, 10000);
          });
        });
      });
    });
  } else {
    globalStore.addToLog(`No access token delivered`);
    globalStore.addToLog(`Please deliver access token`);
    globalStore.running = false;
  }
};

let getUser = async (callback) => {
  waiter.wait(() => {
    let url = `${config.default.quipHost}users/current`;
    axios.default
      .get(url, {
        headers: {
          Authorization: "Bearer " + globalStore.quipToken,
        },
      })
      .then((res) => {
        if (res && res.data) {
          let user = res.data;
          console.log(user);
          globalStore.addToLog(
            `Received user object with the user's name ${user.name}`
          );
          callback(user);
        } else {
          globalStore.addToLog(`No user object received`);
        }
      })
      .catch((err) => {
        globalStore.running = false;
        globalStore.addToLog(
          `Error while getting user: ${JSON.stringify(err.message)}`
        );
        if (
          err.response &&
          err.response.status &&
          err.response.status === 401
        ) {
          globalStore.addToLog("Your access token seems to be invalid.");
        }
      });
  });
};

let getFolder = async (id, callback) => {
  waiter.wait(() => {
    let url = `${config.default.quipHost}folders/${id}`;
    axios.default
      .get(url, {
        headers: {
          Authorization: "Bearer " + globalStore.quipToken,
        },
      })
      .then((res) => {
        if (res && res.data) {
          let folder = res.data;
          console.log(folder);
          globalStore.addToLog(
            `Start exporting folder with the title ${folder.folder.title}`
          );
          callback(folder);
        } else {
          globalStore.addToLog(`No folder object received`);
        }
      })
      .catch((err) => {
        globalStore.running = false;
        globalStore.addToLog(
          `Error while getting folder: ${JSON.stringify(err.message)}`
        );
        if (
          err.response &&
          err.response.status &&
          err.response.status === 401
        ) {
          globalStore.addToLog("Your access token seems to be invalid.");
        }
      });
  });
};

// https://mostafa-samir.github.io/async-iterative-patterns-pt1/
function waterfallOverFolder(folder, iterator, callback) {
  var tree = {};
  const id = folder.folder.id;
  tree[id] = [];
  var nextItemIndex = 0;
  const length = folder.children.length;
  const name = folder.folder.title;
  const cleanName = clean(name);

  path.push(cleanName);

  // createFolder(path.join('/')); // folder will be generated directly in zip

  function report(res) {
    if (res) {
      tree[id].push(res);
    }
    nextItemIndex++;
    if (nextItemIndex === length) {
      path.pop();
      callback(tree);
    } else {
      iterator(folder.children[nextItemIndex], report);
    }
  }
  iterator(folder.children[0], report);
}

// https://stackoverflow.com/questions/1909815/regex-to-compare-strings-with-umlaut-and-non-umlaut-variations
// https://stackoverflow.com/questions/4374822/remove-all-special-characters-with-regexp
function clean(str) {
  let tr = { ä: "ae", ü: "ue", ö: "oe", ß: "ss", Ä: "Ae", Ü: "Ue", Ö: "Oe" };
  let clean = str.replace(/[^A-Za-z0-9äöüÄÖÜß]/gi, "");
  clean = clean.replace(/[äöüÄÖÜß]/g, function ($0) {
    return tr[$0];
  });
  return clean;
}

function waitForUnpause() {
  return new Promise((resolve) => {
    let interval = setInterval(() => {
      console.log("paused", globalStore.exportPaused);
      if (!globalStore.exportPaused) {
        clearInterval(interval);
        resolve();
      }
    }, 2000);
  });
}

// iterator
async function processObj(obj, report) {
  if (waiter.totalC > numAPICallsToPause && !globalStore.donated) {
    if (!globalStore.zipFile) {
      zipService.generateAsync({ type: "blob" }).then(function (blob) {
        globalStore.addToLog(`Zip file ${rootDir}_demo created`);
        globalStore.zipFile = blob;
        globalStore.rootDir = rootDir + "_demo";
        globalStore.exportPaused = true;
        globalStore.numAPIcalls = waiter.totalC;
        globalStore.running = false;
      });
    }
    await waitForUnpause();
    globalStore.running = true;
  }
  if (obj.hasOwnProperty("thread_id")) {
    getThread(obj["thread_id"], (thread) => {
      let threadName = clean(thread.thread.title);

      path.push(threadName);
      let threadFilePath = path.join("/");
      path.pop();

      extractAndReplaceImgsInHTML(
        thread.html,
        thread.thread.id,
        threadName,
        (html) => {
          createHTMLAndMdFile(threadFilePath, thread.thread.title, html);
          fetchDocxAndWriteToFile(obj["thread_id"], threadFilePath);
          report(obj["thread_id"]);
        }
      );
    });
  } else if (obj.hasOwnProperty("folder_id")) {
    getFolder(obj["folder_id"], (folder) => {
      // recursion
      waterfallOverFolder(folder, processObj, function (tree) {
        report(tree);
      });
    });
  } else {
    report(null);
  }
}

let getThread = async (id, callback) => {
  waiter.wait(() => {
    let url = `${config.default.quipHost}threads/${id}`;
    axios.default
      .get(url, {
        headers: {
          Authorization: "Bearer " + globalStore.quipToken,
        },
      })
      .then((res) => {
        if (res && res.data && res.data.thread) {
          let thread = res.data;
          globalStore.addToLog(
            `Start exporting thread with the title ${clean(
              thread.thread.title
            )}`
          );
          callback(thread);
        } else {
          globalStore.addToLog(
            `Lost thread with the id ${id}, please check with https://platform.quip.com/1/threads/${id}`
          );
        }
      })
      .catch((err) => {
        console.log(err);
        globalStore.addToLog(
          `Error while getting thread: ${JSON.stringify(err.message)}`
        );
        if (
          err.response &&
          err.response.status &&
          err.response.status === 401
        ) {
          globalStore.addToLog("Your access token seems to be invalid.");
        }
      });
  });
};

function extractAndReplaceImgsInHTML(html, threadId, threadTitle, callback) {
  var m;
  var images = [];

  // https://stackoverflow.com/questions/14939296/extract-image-src-from-a-string
  const rex = /<img.*?src='([^">]*\/([^">]*?))'.*?>/gm;

  while ((m = rex.exec(html))) {
    let imageFolderName =
      "_images_" + threadTitle.substr(0, 6) + "_" + threadId;
    let imageFileName = threadTitle.substr(0, 6) + "_" + images.length + ".png";

    path.push(imageFolderName);
    path.push(imageFileName);
    let imageFilePath = path.join("/");
    path.pop();
    path.pop();

    let imageUrl = imageFolderName + "/" + imageFileName;

    let blobPath = m[1];
    blobPath = blobPath.substr(1, blobPath.length); // delete / at the beginning

    images.push({
      blobPath: blobPath,
      imageUrl: imageUrl,
      imageFilePath: imageFilePath,
    });

    html = html.replace(m[1], imageUrl);
  }

  fetchImageAndWriteToFile(images, function () {
    callback(html);
  });
}

function fetchImageAndWriteToFile(images, callback) {
  if (images.length > 0) {
    let path = images[0].blobPath;
    let imageFilePath = images[0].imageFilePath;

    waiter.wait(() => {
      let url = config.default.quipHost + path;
      axios.default
        .get(url, {
          headers: {
            Authorization: "Bearer " + globalStore.quipToken,
          },
          responseType: "arraybuffer",
        })
        .then((res) => {
          let imgString = new Buffer.from(res.data, "binary");
          zipService.file(imageFilePath, imgString, { binary: true });
          globalStore.addToLog(`Image ${imageFilePath} written`);

          images.shift();
          fetchImageAndWriteToFile(images, callback);
        })
        .catch((err) => {
          globalStore.addToLog(
            `Error while fetching image file ${imageFilePath}`
          );

          images.shift();
          fetchImageAndWriteToFile(images, callback);
        });
    });
  } else {
    callback();
  }
}

function fetchDocxAndWriteToFile(threadId, path) {
  if (threadId) {
    waiter.wait(() => {
      let url = `${config.default.quipHost}threads/${threadId}/export/docx`;
      axios.default
        .get(url, {
          headers: {
            Authorization: "Bearer " + globalStore.quipToken,
          },
          responseType: "arraybuffer",
        })
        .then((res) => {
          let fileString = new Buffer.from(res.data, "binary");
          zipService.file(path + ".docx", fileString, { binary: true });
          globalStore.addToLog(`Docx ${path} written`);
        })
        .catch((err) => {
          globalStore.addToLog(`Error while fetching docx file ${path}`);
        });
    });
  }
}

function createHTMLAndMdFile(path, title, body) {
  let html =
    "<!doctype html><html><head><title>" +
    title +
    '</title><meta charset="UTF-8"></head><body>';
  html += body;
  html += "</body></html>";
  zipService.file(path + ".html", html);
  zipService.file(path + ".md", mdService.turndown(html));
  globalStore.addToLog(`Documents ${path}.md & .html written`);
}
