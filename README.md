# Ban Checkrrr

- [Setup](#setup)
  - [Register an application with Twitch](#register-an-application-with-twitch)
  - [Creating access tokens with Twitch CLI](#creating-access-tokens-with-twitch-cli)
- [Setup the infrastructure on Cloudflare](#setup-the-infrastructure-on-cloudflare)
  - [Storing the Environment Variables](#storing-the-environment-variables)
- [Usage](#usage)
  - [Request `GET /`](#request-get-)
    - [Authentication](#authentication)
    - [Payload](#payload)
    - [Example Request](#example-request)
    - [Response](#response)
    - [Errors](#errors)

## Setup

In order to use this, you will need to register an application in the Twitch Developer console and use the [Twitch CLI](https://dev.twitch.tv/docs/cli/token-command) to generate a user access token and refresh token for you for that application.

### Register an application with Twitch

Follow the instructions in the official Twitch documentation for how to register an application: https://dev.twitch.tv/docs/authentication/register-app

It will need to be an application not an extension.

### Creating access tokens with Twitch CLI

You'll need to create an access token with the following scopes:

-   `moderation:read`

Run the following command in the terminal after having installed the Twitch CLI:

    twitch configure

Input the request client ID and client secret for the application you just registered.

Then run the following command to generate a token with the required scopes:

    twitch token -u -s 'moderation:read'

This will output a user access token and a refresh token to your console. **Do not share either as these are sensitive**.

## Setup the infrastructure on Cloudflare

You will need to set up a Cloudflare Worker function and KV namespace.

Here are some references:

-   [Overview of Cloudflare Workers](https://developers.cloudflare.com/workers/)
-   [KV Namespaces](https://developers.cloudflare.com/workers/runtime-apis/kv/)

### Storing the Environment Variables

You will need to store the access token and the refresh token in the environment using KV namespaces.

    npx wrangler kv:key put <key> <value> --namespace-id <namespace-id>

Here is how you can store the user access token:

    npx wrangler kv:key put access_token <YOUR_ACCESS_TOKEN> --namespace-id <YOUR_NAMESPACE_ID>

And the refresh token:

    npx wrangler kv:key put refresh_token <YOUR_REFRESH_TOKEN> --namespace-id <YOUR_NAMESPACE_ID>

The full list of constants that are required to be stored in KV are available in the `./src/constants.ts` file.

-   `access_token` – Generated using the Twitch CLI
-   `refresh_token` – Generated using the Twitch CLI
-   `twitch_client_id` – from the Twitch Dev dashboard
-   `twitch_client_secret` – from the Twitch Dev dashboard
-   `broadcaster_user_id` – your user ID
-   `hmac_secret` – a randomly-generated secret to use for server-to-server communication

## Usage

Once the app is running and deployed, you can communicate with it using the HMAC secret.

### Request `GET /`

#### Authentication

A request header that looks like this:

-   key: `Authorization`
-   value: `Bearer HMAC_SECRET`

Where `HMAC_SECRET` is the above-mentioned generated secret.

#### Payload

| Query Parameter | Description                                                       |
| --------------- | ----------------------------------------------------------------- |
| `user_id`       | The user ID of the user to check is on the broadcaster's ban list |

#### Example Request

You would make a request as follows:

```sh
curl https://ban-checkrrr.<your-username>.workers.dev/?user_id=123456 -H 'Authorization: Bearer HMAC_SECRET'
```

#### Response

The response is JSON with the following properties:

| Property    | Type    | Description                                                          |
| ----------- | ------- | -------------------------------------------------------------------- |
| `is_banned` | Boolean | Whether the user has been banned or not in the broadcaster's channel |

Example response:

```json
{
    "is_banned": false
}
```

#### Errors

- `400` when the required `user_id` query parameter is not provided
- `401` when the HMAC token is not provided or is incorrect
- `403` when the access token and refresh token have been revoked
- `500` when an unknown error has occured, e.g. misconfiguration of the server, or another unexpected error
