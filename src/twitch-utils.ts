import { makeGet } from "./http-utils";

type IsUserBanned = {
  token: string
  userId: string
  twitchClientId: string
  broadcasterUserId: string
}

type GetBannedUsersResponse = {
  data: {
    user_id: string,
    user_login: string,
    user_name: string,
    reason: string,
    moderator_id: string,
    moderator_login: string,
    moderator_name: string,
  }[]
}

export const isUserBanned = async ({
  token,
  twitchClientId,
  userId,
  broadcasterUserId,
}: IsUserBanned): Promise<boolean> => {
  const requestOptions = {
    headers: {
      'Client-Id': twitchClientId,
      'Authorization': `Bearer ${token}`
    }
  }

  const url = `https://api.twitch.tv/helix/moderation/banned?broadcaster_id=${broadcasterUserId}&user_id=${userId}`

  try {
    const response = await makeGet<GetBannedUsersResponse>(url, requestOptions)
    return response.data.length > 0

  } catch (e) {
    console.error('🔥 Get Banned User error', e)
    return Promise.reject();
  }
}


type TokenRefreshRequest = {
  refreshToken: string
  twitchClientId: string
  twitchClientSecret: string
}

type TokenRefreshResponse = {
  access_token: string
  refresh_token: string
  scope: string[]
  token_type: string // 'bearer'
}

/**
 * Donné un refresh token, refrèche-le!
 */
export const performTokenRefresh = async ({
  refreshToken,
  twitchClientId,
  twitchClientSecret,
}: TokenRefreshRequest): Promise<TokenRefreshResponse> => {
  console.log('🎃 Performing token refresh')

  try {
    const url = 'https://id.twitch.tv/oauth2/token'
    const body = {
      client_id: twitchClientId,
      client_secret: twitchClientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }
    const formBody = Object.entries(body)
      .map(([key, value]) => {
        const encodedKey = encodeURIComponent(key);
        const encodedValue = encodeURIComponent(value);
        return encodedKey + "=" + encodedValue
      })
      .join("&")

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody
    }

    const response = await fetch(url, requestOptions)
    const json = response.json<TokenRefreshResponse>()

    return json
  } catch (e) {
    console.error('🔥 Token Refresh error', e)
    return Promise.reject('🔥 Token Refresh error')
  }
}
