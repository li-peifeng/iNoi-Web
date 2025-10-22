import SubtitlesOctopus from "libass-wasm"
import workerUrl from "libass-wasm/dist/js/subtitles-octopus-worker.js?url"
import wasmUrl from "libass-wasm/dist/js/subtitles-octopus-worker.wasm?url"

let instance = null

function isAbsoluteUrl(url) {
  return /^https?:\/\//.test(url)
}

function toAbsoluteUrl(url) {
  if (isAbsoluteUrl(url)) return url
  return new URL(url, document.baseURI).toString()
}

function loadWorker({ workerUrl, wasmUrl }) {
  return new Promise((resolve) => {
    fetch(workerUrl)
      .then((res) => res.text())
      .then((text) => {
        let workerScriptContent = text

        workerScriptContent = workerScriptContent.replace(
          /wasmBinaryFile\s*=\s*"(subtitles-octopus-worker\.wasm)"/g,
          (_match, wasm) => {
            if (!wasmUrl) {
              wasmUrl = new URL(wasm, toAbsoluteUrl(workerUrl)).toString()
            } else {
              wasmUrl = toAbsoluteUrl(wasmUrl)
            }

            return `wasmBinaryFile = "${wasmUrl}"`
          },
        )

        const workerBlob = new Blob([workerScriptContent], {
          type: "text/javascript",
        })
        resolve(URL.createObjectURL(workerBlob))
      })
  })
}

function setVisible(visible) {
  if (instance.canvasParent)
    instance.canvasParent.style.display = visible ? "block" : "none"
}

function artplayerPluginAss(options) {
  return async (art) => {
    // 最小化配置，使用系统默认字体
    instance = new SubtitlesOctopus({
      workerUrl: await loadWorker({ workerUrl, wasmUrl }),
      video: art.template.$video,
      ...options,
    })

    instance.canvasParent.className = "artplayer-plugin-ass"
    instance.canvasParent.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      user-select: none;
      pointer-events: none;
      z-index: 20;
    `

    art.on("artplayer-plugin-ass:switch", (subtitle) => {
      instance.freeTrack()
      instance.setTrackByUrl(subtitle)
      setVisible(true)
    })

    art.on("subtitle", (visible) => setVisible(visible))
    art.on("artplayer-plugin-ass:visible", (visible) => setVisible(visible))
    art.on("subtitleOffset", (offset) => (instance.timeOffset = offset))
    art.on("destroy", () => instance.dispose())

    return {
      name: "artplayerPluginAss",
      instance: instance,
    }
  }
}

export default artplayerPluginAss
