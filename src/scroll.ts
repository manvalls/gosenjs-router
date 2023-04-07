import { apply } from './apply'
import { RouterOptions, RouterInit } from './types'
import { getUID } from './uid'
import { entryUID, lastAppliedURL } from './keys'

export const updateEntryUID = (options?: RouterOptions) => {
  const w = options?.window || window
  const s = w.history.state || {}

  if (s.__entryUID) {
    w[entryUID] = s.__entryUID
    return
  }

  w[entryUID] = s.__entryUID = getUID()
  history.replaceState(s, '', w.location.href)
}

export const storeScrollPosition = (options?: RouterOptions) => {
  const w = options?.window || window
  const session = w.sessionStorage

  if (!window[entryUID]) {
    return
  }
  
  try {
    session.setItem(window[entryUID], JSON.stringify({
      x: w.document.documentElement.scrollLeft || w.document.body.scrollLeft,
      y: w.document.documentElement.scrollTop || w.document.body.scrollTop,
    }))
  } catch (err) {
    console.error(err)
  }
}

export const scrollToURL = (url: string, options?: RouterOptions) => {
  const w = options?.window || window
  const { hash } = new URL(url, w.location.href)
  if (!hash) {
    w.scrollTo(0, 0)
    return
  }

  const el = w.document.querySelector(hash)
  if (!el) {
    w.scrollTo(0, 0)
    return
  }

  el.scrollIntoView()
}

export const applyOrScroll = async (url: string, options?: RouterInit) => {
  const w = options?.window || window
  const method = options?.method || 'GET'
  if (method.toLowerCase() === 'get' && (w[lastAppliedURL] || '').split('#')[0] === url.split('#')[0]) {
    scrollToURL(url, options)
    return true
  }

  return await apply(url, options)
}

export const restoreScroll = (options?: RouterOptions) => {
  const w = options?.window || window
  const session = w.sessionStorage

  if (!window[entryUID]) {
    return
  }

  try {
    const pos = JSON.parse(session.getItem(window[entryUID]) || '{}')
    w.scrollTo(pos.x || 0, pos.y || 0)
  } catch (err) {
    console.error(err)
  }
}
