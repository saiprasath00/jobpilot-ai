# MWAPI integration

Jobpilot uses MWAPI directly over HTTPS. No PowerShell installer, Claude Code installation, or changes to global terminal settings are needed.

## Provider and model

- Gateway: **https://api.mwapi.dev**
- Model catalog: `GET /v1/models`
- Generation endpoint: `POST /v1/messages`
- Selected model ID: **claude-sonnet-4-6**
- Authentication: `Authorization: Bearer <your MWAPI key>`
- Protocol version header: `anthropic-version: 2023-06-01`
- Request format: Anthropic Messages-compatible JSON

MWAPI is a third-party gateway, not the official Anthropic API. The model ID is the name reported by MWAPI; Jobpilot cannot independently verify the gateway's upstream routing. Its billing, availability, and data-handling policies are separate from an OpenAI or Anthropic subscription.

## Local setup

```sh
npm ci
npm run browser:install
npm run setup -- --provider=mwapi
npm start
```

The setup prompt hides your key and writes it to the ignored, owner-readable `.env` file. It preserves other existing configuration. Do not paste keys into source files or commit `.env`.

Configuration names:

```dotenv
AI_PROVIDER=mwapi
MWAPI_API_KEY=YOUR_PRIVATE_KEY
MWAPI_MODEL=claude-sonnet-4-6
```

The base URL is fixed in `lib/mwapi.mjs` to prevent accidentally sending this key to a different host. HTTP redirects are rejected. Keys are used only on the server.

## Render setup

The repository's `render.yaml` selects MWAPI by default. Create the service from the Blueprint and enter `MWAPI_API_KEY` in Render's private environment settings. It also requires `APP_PASSWORD` to protect the workspace; the Blueprint generates it. An existing service must have its environment variables updated and redeployed; editing the YAML alone does not replace existing secrets.

Render currently requires payment information before this account can create the selected free-plan service. No Render service has been created. This requirement is unrelated to MWAPI credits.

## What the integration sends

Resume analysis, ranking, application drafting, and form filling send relevant resume/job/form text to MWAPI and its upstream providers. Web-search prompts use extracted professional skills, target roles, and search preferences, rather than the raw resume. Avoid entering contact details in the search-preferences field. The UI discloses the provider data flow before an agent run.

A structured request uses a named tool with an `input_schema` and a forced `tool_choice`. Jobpilot validates the returned object against that schema. It does not interpret an arbitrary text response as successful structured output.

For example, a minimal connection request body, with authentication supplied separately in the HTTP header, is:

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 100,
  "messages": [{"role": "user", "content": "Return connected=true."}],
  "tools": [{
    "name": "connection_check",
    "description": "Return the connection test result.",
    "input_schema": {
      "type": "object",
      "properties": {"connected": {"type": "boolean"}},
      "required": ["connected"],
      "additionalProperties": false
    }
  }],
  "tool_choice": {"type": "tool", "name": "connection_check"}
}
```

## Web search and fallback

The adapter requests the Anthropic-compatible `web_search_20250305` server tool, with up to four searches per response. It collects source URLs only from web-search result blocks and citations. Uncited model-generated links are not accepted as research evidence. Limited continuation handles the protocol's `pause_turn` response.

If MWAPI does not support web search for the account/model, the UI reports that limitation. The agent then uses available Remotive and Arbeitnow feed records; it does not pretend feed-only results are a whole-web search. The app cannot guarantee complete job coverage or that every posting remains open.

## Verification

- Authenticated `GET /v1/models`: HTTP 200; selected model was present.
- Live structured generation: succeeded and returned `connected: true`.
- Live web-search request: returned HTTP 502 from MWAPI. Web-search capability is not verified for this account/model; real public-feed fallback is available.
- 17 automated backend/security tests passed, including provider isolation, schema handling, source extraction, missing web evidence, and credit errors.
- Full job searches with a real user resume and real application submissions are not part of the connection test.

## Troubleshooting

- **401/403:** key rejected or account lacks permission. Update the private server key.
- **402/429:** check MWAPI's balance, rate limits, and account restrictions.
- **400:** model or requested tool may not be supported by the gateway.
- **No web evidence:** public-feed fallback is used and reported.
- **Timeout:** the server stops a model request after 120 seconds; retry later.

Provider references used to discover the integration: [MWAPI homepage](https://api.mwapi.dev/) and its [published Claude installer](https://api.mwapi.dev/install.ps1?client=claude). The installer was read as text, never executed. The HTTP endpoints and structured generation were then checked directly.
