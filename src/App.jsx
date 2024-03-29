import React from "react";
import { view } from "@risingstack/react-easy-state";
import globalStore from "./globalStore";
import avatar from "./assets/pf_sq_low-res.jpg";
import logo from "./assets/Logo_Quip-Exporter.png";
import donateIcon from "./assets/icon_donate.png";
import { saveAs } from "file-saver";

let exporter = require("./exporter/exporter");

// https://quip.com/api/personal-token

class App extends React.Component {
  startExporting() {
    globalStore.zipFileFinished = false;
    if(!globalStore.running && !globalStore.exportPaused && !globalStore.exportPausedByUser){
      globalStore.finished = false;
      let at = document.getElementById("accesstoken").value;
      exporter.startExporting(at);
    } else if (globalStore.exportPausedByUser){
      globalStore.exportPausedByUser = false;
      globalStore.running = true;
    }
  }

  donateAndContinue() {
    window.open("https://paypal.me/mindactuate", "_blank");
    globalStore.donated = true;
    globalStore.exportPaused = false;
  }

  downloadZip() {
    saveAs(globalStore.zipFile, globalStore.rootDir);
  }

  pauseExportingByUser(){
    globalStore.zipFileFinished = false;
    globalStore.exportPausedByUser = true;
    globalStore.running = false;
  }

  render() {
    return (
      <div>
        <div id="container">
          <div id="content-left">
            <h1>The Quip Exporter</h1>
            <table>
              <tbody>
                <tr>
                  <td valign="top">
                    <img src={logo} alt="logo" className="smallImages" />
                  </td>
                  <td valign="top">
                    <p>
                      Quip is a great tool to create well formatted documents on
                      desktop as well as on mobile devices. Unfortunately it
                      lacks two important features:
                    </p>
                    <ol>
                      <li>To export all documents at once</li>
                      <li>To export to html or md including image files</li>
                    </ol>
                    <p>This tool will perform a</p>
                    <ul>
                      <li>
                        <span id="highlight">full export</span> of your Quip
                        account's{" "}
                      </li>
                      <li>
                        <span id="highlight">private &amp; shared folders</span>
                        .
                      </li>
                    </ul>
                    <p>The files will be exported as</p>
                    <ul>
                      <li>
                        <span id="highlight">HTML, md &amp; docx</span> files
                      </li>
                      <li>
                        <span id="highlight">including all of your images</span>
                        .
                      </li>
                    </ul>
                    <p>
                      Please keep in mind that it will not loop through your
                      recycle bin and starred folder.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            <h2>About me and ref to Github</h2>
            <table>
              <tbody>
                <tr>
                  <td valign="top">
                    <img src={avatar} alt="avatar" className="smallImages" />
                  </td>
                  <td valign="top">
                    <p>
                      My name is Daniel Gruner, I am a software engineer from Germany.
                      Find me at Github under{" "}
                      <a href="https://github.com/mindactuate" target="blank">
                        github.com/mindactuate
                      </a>{" "}
                      or at dev.to under{" "}
                      <a href="https://dev.to/mindactuate" target="blank">
                        dev.to/mindactuate
                      </a>
                      .
                      <br />
                      <br />
                      Or you can send me an email to dnlgrnr911[at]gmail.com.
                      <br />
                      <br />
                      You can find the code repository of this app{" "}
                      <a
                        href="https://github.com/mindactuate/quip-exporter"
                        target="blank"
                      >
                        here
                      </a>
                      .
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            <h2>Impressum and privacy</h2>
            <p>
              You can find the impressum and gdpr privacy in German under{" "}
              <a
                href="https://mindactuate.github.io/impressum-datenschutz/"
                target="blank"
              >
                mindactuate.github.io/impressum-datenschutz/
              </a>
            </p>
          </div>
          <div id="content-right">
            <h2>Donating</h2>
            <table>
              <tbody>
                <tr>
                  <td valign="top">
                    <a
                      href="https://paypal.me/mindactuate"
                      target="blank"
                    >
                      <img
                        src={donateIcon}
                        alt="donateIcon"
                        className="smallImages"
                      />
                    </a>
                  </td>
                  <td valign="top">
                    <p>
                      This app is a lot of work. Please consider donating just a
                      little. :) You can{" "}
                      <a
                        href="https://paypal.me/mindactuate"
                        target="blank"
                      >
                        paypal me
                      </a>
                      . That´s an effort of 5 seconds.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            <h2>Access token</h2>
            <p>
              Please get your Quip access token from{" "}
              <a href="https://quip.com/dev/token" target="blank">
                quip.com/dev/token
              </a>{" "}
              and paste it into the form input.
              <br />
              <br />
              <s>
                You can be sure that your token is used only locally in your web
                browser and is not transmitted anywhere else but{" "}
                <a
                  href="https://quip.com/dev/automation/documentation"
                  target="blank"
                >
                  platform.quip.com
                </a>{" "}
                Therefore you can check the network traffic with help of the
                developer tools from your browser.
              </s>{" "}
              <b style={{ color: "red" }}>Important note:</b> I am currently in
              contact with Quip to get a CORS trust for my github page.
              Temporarily I have implemented a Cloudflare cors-proxy as
              man-in-the-middle. You can find the code for the cors-proxy in my
              repository. Unfortunately I only have 100.000 free calls per day
              on Cloudflare. I hope to find a solution with Quip soon.
            </p>
            <div id="tokenform">
              <label>Quip Access token</label>
              <br />
              <input
                type="text"
                id="accesstoken"
                name="accesstoken"
                style={{ width: "100%", height: "30px" }}
                autoComplete="off"
              />
            </div>
            <h2>Start exporting</h2>
            <p>
              After hitting the button the exporter starts to export. Please
              have an eye on the Logs. Depending on how many documents and how
              many images you have, the export process can last multiple hours
              or even days. The reason is that Quip limits the number of API
              requests per minute and per hour for each API token. Please keep
              this window open and your PC running.
              <br />
              <br />
              <b style={{ color: "red" }}>
                Do not close or refresh this window / tab while exporting.
              </b>
              <br />
              <br /> After the export is complete you can download a zip (which
              is generated and filled by your browser on the run.)
            </p>
            <div hidden={globalStore.running}>
              <input
                type="button"
                value="Start exporting"
                disabled={globalStore.exportPaused}
                style={{ width: "100%", height: "50px" }}
                onClick={() => this.startExporting()}
              />
            </div>
            <div hidden={!globalStore.running}>
              <input
                type="button"
                value="Pause exporting and download zip"
                style={{ width: "100%", height: "50px" }}
                onClick={() => this.pauseExportingByUser()}
              />
              <p>
                <b style={{ color: "limegreen" }}>&#9679; Export running</b>
              </p>
            </div>
            <div hidden={!globalStore.exportPausedByUser}>
              <p>Your paused your export. You can download your current zip or continue with exporting.</p>
              <input
                type="button"
                disabled={!globalStore.zipFileFinished}
                value={`${globalStore.zipFileFinished ? "Download zip" : "Wait for zip..."}`}
                id="callToAction"
                onClick={() => this.downloadZip()}
              />
            </div>
            <div hidden={!globalStore.exportPaused}>
              <p>
                You exported <b>{globalStore.numAPIcalls}</b> documents and
                images now. A friendly reminder:{" "}
                <b>Please donate just a little.</b> You can also download the
                current zip and have a look at the files.
              </p>
              <input
                type="button"
                disabled={!globalStore.zipFileFinished}
                value={`${globalStore.zipFileFinished ? "Download zip" : "Wait for zip..."}`}
                id="callToAction"
                onClick={() => this.downloadZip()}
              />
              <input
                type="button"
                value="Donate and continue"
                id="callToAction"
                style={{ backgroundColor: "gold" }}
                onClick={() => this.donateAndContinue()}
              />
            </div>
            <div hidden={!globalStore.finished}>
              <p>Your export is finished.</p>
              <input
                type="button"
                disabled={!globalStore.zipFileFinished}
                value={`${globalStore.zipFileFinished ? "Download zip" : "Wait for zip..."}`}
                style={{
                  width: "100%",
                  height: "50px",
                  backgroundColor: "gold",
                }}
                onClick={() => this.downloadZip()}
              />
            </div>
          </div>
        </div>
        <h2>Log</h2>
        <div id="logarea">
          {globalStore.log.map((val) => (
            <pre>{val}</pre>
          ))}
        </div>
      </div>
    );
  }
}

export default view(App);
