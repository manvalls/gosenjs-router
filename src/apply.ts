import { versionKey, stateKey, lastAppliedURL } from "./keys"
import { RouterInit } from "./types"
import { getUID } from "./uid"
import { storeScrollPosition } from "./scroll"
import request from "@gosen/request"
import diff from "@gosen/diff"
import { execute } from "@gosen/dom"
import { Command } from "@gosen/command-types"
import { getVersion } from "./router"

let lastRequestUID = ''

export const apply = async (url: string, options?: RouterInit) => {
  const { window: w = window, ...init } = options || {}

  const requestUID = getUID()
  lastRequestUID = requestUID
  storeScrollPosition(options)

  w.document.body.classList.add('gosen-loading')

  const urlWithoutHash = url.split('#')[0]

  const { commands, version } = await request(urlWithoutHash, {
    ...init,
    version: getVersion(options),
  })

  if (lastRequestUID !== requestUID) {
    return false
  }

  w.document.body.classList.remove('gosen-loading')
  w[versionKey] = version
  const commandDiff = diff(w[stateKey] || [], commands)

  w[stateKey] = commands.map((command: Command): Command => {
    if ('tx' in command) {
      return {
        ...command,
        tx: undefined,
      }
    }

    return command
  })

  w[lastAppliedURL] = url
  await execute(w.document, commandDiff)
  return true
}
