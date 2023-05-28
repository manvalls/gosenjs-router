import { lastAppliedURL } from "./keys"
import { RouterOptions } from "./types"
import { applyOrScroll, updateEntryUID, storeScrollPosition, restoreScroll } from "./scroll"

export const handlePopState = (options?: RouterOptions) => {
  const w = options?.window || window
  w.history.scrollRestoration = 'manual'
  w[lastAppliedURL] = w.location.href

  const onPopState = async () => {
    const { applied, url: finalURL } = await applyOrScroll(w.location.href, options)

    if (applied) {
      updateEntryUID(options)
      restoreScroll(options)
      w.history.replaceState(history.state, '', finalURL)
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
