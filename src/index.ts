import { KV_NAMESPACE_KEYS } from "./constants";
import { isUserBanned, performTokenRefresh } from "./twitch-utils";
import { getBearerTokenFromRequestHeaders } from "./http-utils";

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  BAN_CHECKRRR: KVNamespace;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const query = request.url.split('?')[1]
    const params = new URLSearchParams(query)



    // Tokens
    const accessToken = await env.BAN_CHECKRRR.get(KV_NAMESPACE_KEYS.access_token)
    const refreshToken = await env.BAN_CHECKRRR.get(KV_NAMESPACE_KEYS.refresh_token)

    // Credentials
    const twitchClientId = await env.BAN_CHECKRRR.get(KV_NAMESPACE_KEYS.twitch_client_id)
    const twitchClientSecret = await env.BAN_CHECKRRR.get(KV_NAMESPACE_KEYS.twitch_client_secret)
    const hmacSecret = await env.BAN_CHECKRRR.get(KV_NAMESPACE_KEYS.hmac_secret)

    const broadcasterUserId = await env.BAN_CHECKRRR.get(KV_NAMESPACE_KEYS.broadcaster_user_id)

    // If we don't have all the required values in the KV namespace, throw
    if (!accessToken || !broadcasterUserId || !twitchClientId || !refreshToken || !twitchClientSecret || !hmacSecret) {
      return new Response(JSON.stringify({
        error: 'Server Configuration Error'
      }), {
        status: 500,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
      })
    }

    const authToken = getBearerTokenFromRequestHeaders(request)
    if (!authToken || hmacSecret !== authToken) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
      })
    }

    // Query param ?user_id is required
    const userId = params.get('user_id')
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Missing param user_id'
      }), {
        status: 400,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
      })
    }

    try {
      // First attempt to verify if the user is banned using the access token
      const isBanned = await isUserBanned({
        token: accessToken,
        userId,
        broadcasterUserId,
        twitchClientId,
      })

      return new Response(JSON.stringify({
        is_banned: isBanned,
      }), {
        status: 200,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        }
      });
    } catch (e) {
      console.error('🔥 isUserBanned failed (1)', e)

      // If fails, try again but refresh the token first.
      try {
        const { access_token: accessToken } = await performTokenRefresh({
          refreshToken,
          twitchClientSecret,
          twitchClientId,
        })

        // Store the new access token
        await env.BAN_CHECKRRR.put(KV_NAMESPACE_KEYS.access_token, accessToken)

        // Try again after refreshing the access token
        try {
          const isBanned = await isUserBanned({
            token: accessToken,
            userId,
            broadcasterUserId,
            twitchClientId,
          })

          return new Response(JSON.stringify({
            is_banned: isBanned,
          }), {
            status: 200,
            headers: {
              'content-type': 'application/json;charset=UTF-8',
            }
          });
        } catch (e) {
          console.error('🔥 isUserBanned failed (2)', e)

          return new Response(JSON.stringify({
            error: 'Unknown Server Error'
          }), {
            status: 500,
            headers: {
              'content-type': 'application/json;charset=UTF-8',
            },
          })
        }
      } catch (e) {
        console.error('🔥 Failed to fetch after refreshing the token')

        return new Response(JSON.stringify({
          error: 'Authorization Error'
        }), {
          status: 403,
          headers: {
            'content-type': 'application/json;charset=UTF-8',
          },
        })
      }
    }
  },
};
