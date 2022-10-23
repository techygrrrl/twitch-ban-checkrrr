# Ban Checkrrr

- [Setup](#setup)
  - [Register an application with Twitch](#register-an-application-with-twitch)
  - [Creating access tokens with Twitch CLI](#creating-access-tokens-with-twitch-cli)
- [Setup the infrastructure on Cloudflare](#setup-the-infrastructure-on-cloudflare)
  - [Storing the Tokens](#storing-the-tokens)


## Setup

In order to use this, you will need to register an application in the Twitch Developer console and use the [Twitch CLI](https://dev.twitch.tv/docs/cli/token-command) to generate a user access token and refresh token for you for that application.


### Register an application with Twitch

Follow the instructions in the official Twitch documentation for how to register an application: https://dev.twitch.tv/docs/authentication/register-app

It will need to be an application not an extension.


### Creating access tokens with Twitch CLI

You'll need to create an access token with the following scopes:

- `moderation:read`

Run the following command in the terminal after having installed the Twitch CLI:

    twitch configure

Input the request client ID and client secret for the application you just registered.

Then run the following command to generate a token with the required scopes:

    twitch token -u -s 'moderation:read'

This will output a user access token and a refresh token to your console. **Do not share either as these are sensitive**.


## Setup the infrastructure on Cloudflare

You will need to set up a Cloudflare Worker function and KV namespace.

Here are some references:

- [Overview of Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [KV Namespaces](https://developers.cloudflare.com/workers/runtime-apis/kv/)


### Storing the Tokens

Store the tokens in your new KV namespace. Run the following command:

    npx wrangler kv:key put access_token <YOUR_ACCESS_TOKEN> --namespace-id <YOUR_NAMESPACE_ID>

Do the same with the refresh tokeN:

    npx wrangler kv:key put refresh_token <YOUR_REFRESH_TOKEN> --namespace-id <YOUR_NAMESPACE_ID>
