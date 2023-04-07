import request from '@gosen/request'
import diff from '@gosen/diff'
import { execute } from '@gosen/dom'
import { Command } from '@gosen/command-types'

const versionKey = '__GOSEN_PAGE_VERSION__'
const stateKey = '__GOSEN_PAGE_STATE__'
const entryUID = Symbol('entryUID')

export type RouterOptions = {
  window?: Window
}

export type RouterInit = RouterOptions & Omit<RequestInit, 'window'>

const getUID = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(-5)

export const getVersion = (options?: RouterOptions) => {
  const w = options?.window || window
  return (w[versionKey] || '') + ''
}

let lastAppliedURL = ''
let lastRequestUID = ''

const apply = async (url: string, options?: RouterInit) => {
  const { window: w = window, ...init } = options || {}

  const requestUID = getUID()
  lastRequestUID = requestUID
  storeScrollPosition(options)

  const urlWithoutHash = url.split('#')[0]

  const { commands, version } = await request(urlWithoutHash, {
    ...init,
    version: getVersion(options),
  })

  if (lastRequestUID !== requestUID) {
    return false
  }

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

  lastAppliedURL = url
  await execute(w.document, commandDiff)
  return true
}

const scrollToURL = (url: string, options?: RouterOptions) => {
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

const applyOrScroll = async (url: string, options?: RouterInit) => {
  const method = options?.method || 'GET'
  if (method.toLowerCase() === 'get' && lastAppliedURL.split('#')[0] === url.split('#')[0]) {
    scrollToURL(url, options)
    return true
  }

  return await apply(url, options)
}

export const push = async (url: string, options?: RouterInit) => {
  const applied = await applyOrScroll(url, options)
  if (!applied) {
    return
  }

  const w = options?.window || window

  scrollToURL(url, options)
  w[entryUID] = getUID()
  w.history.pushState({ __entryUID: w[entryUID] }, '', url)
}

export const replace = async (url: string, options?: RouterInit) => {
  const applied = await apply(url, options)
  if (!applied) {
    return
  }

  const w = options?.window || window
  w.history.replaceState(history.state, '', url)
}

export const reload = async (options?: RouterOptions) => {
  const w = options?.window || window
  const url = w.location.href
  await apply(url, options)
}

const updateEntryUID = (options?: RouterOptions) => {
  const w = options?.window || window
  const s = w.history.state || {}

  if (s.__entryUID) {
    w[entryUID] = s.__entryUID
    return
  }

  w[entryUID] = s.__entryUID = getUID()
  history.replaceState(s, '', w.location.href)
}

const storeScrollPosition = (options?: RouterOptions) => {
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

const restoreScroll = (options?: RouterOptions) => {
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

export const handlePopState = (options?: RouterOptions) => {
  const w = options?.window || window
  w.history.scrollRestoration = 'manual'
  lastAppliedURL = w.location.href

  const onPopState = async () => {
    const applied = await applyOrScroll(w.location.href, options)

    if (applied) {
      updateEntryUID(options)
      restoreScroll(options)
    }
  }

  const addListener = () => {
    w.addEventListener('popstate', onPopState, false)
  }

  const onLoad = () => {
    w.removeEventListener('load', onLoad, false)
    setTimeout(() => {
      addListener()
    }, 0)
  }

  const onChange = () => {
    updateEntryUID(options)
    storeScrollPosition(options)
  }

  w.addEventListener('unload', onChange, false)
  w.addEventListener('hashchange', onChange, false)

  if (document.readyState == 'complete') {
    addListener()
  } else {
    w.addEventListener('load', onLoad, false)
  }

  return () => {
    w.removeEventListener('load', onLoad, false)
    w.removeEventListener('popstate', onPopState, false)
    w.removeEventListener('unload', onChange, false)
    w.removeEventListener('hashchange', onChange, false)
  }
}
