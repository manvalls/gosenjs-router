export type RouterOptions = {
  window?: Window
}

export type RouterInit = RouterOptions & Omit<RequestInit, 'window'>
