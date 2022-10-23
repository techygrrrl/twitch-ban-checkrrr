import { KV_NAMESPACE_KEYS } from "./constants";
import { isUserBanned, performTokenRefresh } from "./twitch-utils";

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

    // Client credentials
    const twitchClientId = await env.BAN_CHECKRRR.get(KV_NAMESPACE_KEYS.twitch_client_id)
    const twitchClientSecret = await env.BAN_CHECKRRR.get(KV_NAMESPACE_KEYS.twitch_client_secret)

    const broadcasterUserId = await env.BAN_CHECKRRR.get(KV_NAMESPACE_KEYS.broadcaster_user_id)

    if (!accessToken || !broadcasterUserId || !twitchClientId || !refreshToken || !twitchClientSecret) {
      return new Response(JSON.stringify({
        error: 'Server Configuration Error'
      }), {
        status: 500,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
      })
    }

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
      // First attempt
      const isBanned = await isUserBanned({
        token: accessToken,
        userId,
        broadcasterUserId,
        twitchClientId,
      })

      const response = {
        is_banned: isBanned,
      }

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        }
      });
    } catch (e) {
      console.error('🔥 handler error', e)

      // If fails, try again but refresh the token first.

      const { access_token: accessToken } = await performTokenRefresh({
        refreshToken,
        twitchClientSecret,
        twitchClientId,
      })

      // Store the new access token
      await env.BAN_CHECKRRR.put(KV_NAMESPACE_KEYS.access_token, accessToken)

      try {
        const isBanned = await isUserBanned({
          token: accessToken,
          userId,
          broadcasterUserId,
          twitchClientId,
        })

        const response = {
          is_banned: isBanned,
        }

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: {
            'content-type': 'application/json;charset=UTF-8',
          }
        });
      } catch (e) {
        console.error('🔥 Failed to fetch after refreshing the token')

        return new Response(JSON.stringify({
          error: 'Unknown Server Error'
        }), {
          status: 500,
          headers: {
            'content-type': 'application/json;charset=UTF-8',
          },
        })
      }
    }
  },
};
