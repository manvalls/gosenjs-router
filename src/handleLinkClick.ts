import { push } from './router'

export const handleLinkClick = (e: EventTarget) => {
  const onClick = (event: MouseEvent) => {
    let target = event.target as Element
    while (target && target.tagName !== 'A') {
      target = target.parentNode as Element
    }

    if (!target || target.tagName !== 'A') {
      return
    }

    if (target.hasAttribute('download') || target.getAttribute('rel') === 'external') {
      return
    }

    let parent = target
    while (parent && parent instanceof Element) {
      if (parent.hasAttribute('data-disable-gosen-router') || parent.hasAttribute('disable-gosen-router')) {
        return
      }

      parent = parent.parentNode as Element
    }

    const href = target.getAttribute('href')
    if (!href) {
      return
    }

    if (href.startsWith('mailto:') || href.startsWith('tel:')) {
      return
    }

    if (href.startsWith('http') && !href.startsWith(window.location.origin)) {
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
