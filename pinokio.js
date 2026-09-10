module.exports = {
  version: "5.0",
  menu: async (kernel, info) => {
    let installed = info.exists("app/env") && info.exists("app/.installed")
    let running = {
      install: info.running("install.js"),
      start: info.running("start.js"),
      update: info.running("update.js"),
      reset: info.running("reset.js")
    }
    if (running.update || running.reset || running.install) {
      const action = running.update ? "update" : running.reset ? "reset" : "install"
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: { install: "Installing", update: "Updating", reset: "Resetting" }[action],
        href: `${action}.js`,
      }]
    } else if (installed) {
      if (running.start) {
        let local = info.local("start.js")
        if (local && local.url) {
          return [{
            default: true,
            icon: "fa-solid fa-rocket",
            text: "Open Web UI",
            href: local.url,
          }, {
            icon: 'fa-solid fa-terminal',
            text: "Terminal",
            href: "start.js",
          }]
        } else {
          return [{
            default: true,
            icon: 'fa-solid fa-terminal',
            text: "Terminal",
            href: "start.js",
          }]
        }
      } else {
        return [{
          default: true,
          icon: "fa-solid fa-power-off",
          text: "Start",
          href: "start.js",
        }, {
          icon: "fa-solid fa-plug",
          text: "Update",
          href: "update.js",
        }, {
          icon: "fa-solid fa-plug",
          text: "Install",
          href: "install.js",
        }, {
          icon: "fa-regular fa-circle-xmark",
          text: "Reset",
          href: "reset.js",
        }]
      }
    } else {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Install",
        href: "install.js",
      }, ...(info.exists("app") ? [{
        icon: "fa-regular fa-circle-xmark",
        text: "Reset",
        href: "reset.js",
      }] : [])]
    }
  }
}
