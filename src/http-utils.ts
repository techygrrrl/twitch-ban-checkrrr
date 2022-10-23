export const makeGet = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  try {
    const response = await fetch(url, options)
    if (!response.ok) {
      console.error('HTTP Response Error', response)
      return Promise.reject()
    }

    return await response.json<T>()
  } catch (e) {
    console.error('makeGet error', e)
    return Promise.reject()
  }
}
