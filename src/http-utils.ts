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


export const getBearerTokenFromRequestHeaders = (request: Request): string | null => {
  try {
    return request.headers.get('Authorization')?.split('Bearer ')[1] || null
  } catch (e) {
    return null
  }
}
