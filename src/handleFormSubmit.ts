import { push } from './router'

export const handleFormSubmit = (e: EventTarget) => {
  const onSubmit = (event: Event) => {
    if (event.defaultPrevented) {
      return
    }

    const target = event.target as HTMLFormElement
    if (!target || target.tagName !== 'FORM') {
      return
    }

    let parent: Element = target
    while (parent && parent instanceof Element) {
      if (parent.hasAttribute('data-disable-gosen-router') || parent.hasAttribute('disable-gosen-router')) {
        return
      }

      parent = parent.parentNode as Element
    }

    const action = target.action || window.location.href
    const method = target.method || 'GET'

    if (method.toUpperCase() === 'GET') {
      let url = new URL(action, window.location.href)

      const formData = new FormData(target)
      for (const [key, value] of formData.entries()) {
        url.searchParams.append(key, value + '')
      }

      event.preventDefault()

      target.classList.add('gosen-loading')
      push(url.toString(), { window: target.ownerDocument.defaultView }).finally(() => {
        target.classList.remove('gosen-loading')
      })

      return
    }

    event.preventDefault()
    target.classList.add('gosen-loading')

    push(action, {
      method,
      body: new FormData(target),
      window: target.ownerDocument.defaultView,
    }).finally(() => {
      target.classList.remove('gosen-loading')
    })
  }

  e.addEventListener('submit', onSubmit)
  return () => {
    e.removeEventListener('submit', onSubmit)
  }
}
