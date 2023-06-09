import { RouterOptions, RouterInit } from "./types"
import { versionKey, entryUID } from "./keys"
import { applyOrScroll, scrollToURL } from "./scroll"
import { getUID } from "./uid"
import { apply } from "./apply"

export const getVersion = (options?: RouterOptions) => {
  const w = options?.window || window
  return (w[versionKey] || '') + ''
}

export const push = async (url: string, options?: RouterInit) => {
  const { applied, url: finalURL } = await applyOrScroll(url, options)
  if (!applied) {
    return
  }

  const w = options?.window || window

  scrollToURL(url, options)
  w[entryUID] = getUID()
  w.history.pushState({ __entryUID: w[entryUID] }, '', finalURL)
}

export const replace = async (url: string, options?: RouterInit) => {
  const { applied, url: finalURL } = await apply(url, options)
  if (!applied) {
    return
  }

  const w = options?.window || window
  w.history.replaceState(history.state, '', finalURL)
}

export const reload = async (options?: RouterOptions) => {
  const w = options?.window || window
  await replace(w.location.href, options)
}
