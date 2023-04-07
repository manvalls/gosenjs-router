import { push } from './router'

export const handleLinkClick = (e: EventTarget) => {
  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented) {
      return
    }

    let target = event.target as HTMLAnchorElement
    while (target && target.tagName !== 'A') {
      target = target.parentNode as HTMLAnchorElement
    }

    if (!target || target.tagName !== 'A') {
      return
    }

    if (target.target && target.target !== '_self') {
      return
    }

    if (target.hasAttribute('download') || target.rel === 'external') {
      return
    }

    let parent: Element = target
    while (parent && parent instanceof Element) {
      if (parent.hasAttribute('data-disable-gosen-router') || parent.hasAttribute('disable-gosen-router')) {
        return
      }

      parent = parent.parentNode as Element
    }

    const href = target.href
    if (!href || !href.startsWith(target.ownerDocument.defaultView.location.origin)) {
      return
    }

    event.preventDefault()
    target.classList.add('gosen-loading')
    push(href, { window: target.ownerDocument.defaultView }).finally(() => {
      target.classList.remove('gosen-loading')
    })
  }

  e.addEventListener('click', onClick)
  return () => {
    e.removeEventListener('click', onClick)
  }
}
