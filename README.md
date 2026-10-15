# Jobpilot — AI job search and application assistant

A mobile-friendly, single-user website using MWAPI’s Claude-compatible API, web search where supported, and an assisted Chromium application browser. OpenAI remains an optional provider.

See [MWAPI setup and API documentation](docs/MWAPI.md).

## Run from GitHub

This repository contains application source only; API keys and private configuration are excluded. The deployed workspace requires a password. GitHub Pages cannot run this Node/Chromium application.

### Hosted website: Render + GitHub

[Deploy this repository on Render](https://render.com/deploy?repo=https://github.com/saiprasath00/jobpilot-ai)

1. Open [Render's Blueprint deployment page](https://dashboard.render.com/select-repo?type=blueprint) and connect your GitHub account. Allow access to `saiprasath00/jobpilot-ai`.
2. Select this repository. Render reads `render.yaml` and creates a free Docker web service. Free instances can sleep and are resource-limited; Chromium may require more memory for heavy application pages.
3. Enter your `MWAPI_API_KEY` in Render's private configuration. A strong `APP_PASSWORD` is generated automatically; retrieve it from the service's Environment settings.
4. Open the HTTPS URL Render provides. Use any username and that `APP_PASSWORD` when the browser asks you to sign in.

GitHub pushes will redeploy the service. The API key belongs in Render's secret settings, never in this repository. The configured AI provider must have available usage credits.

### Run directly on GitHub: Codespaces

Open [Create a Codespace](https://codespaces.new/saiprasath00/jobpilot-ai). Wait for setup, then run `npm run setup` and `npm start` in its terminal. Open port 3000 from the Ports panel and keep its visibility **Private**. The configured secret is local to that Codespace. A Codespace is a temporary development environment, not an always-on website; usage is subject to your GitHub quota and billing settings. No Codespace is created automatically by this repository.

## Start on your computer

Install Node.js 24 or newer, open a terminal in this folder, and run:

```sh
npm ci
npm run browser:install
npm run setup
npm start
```

Setup asks for an MWAPI API key with hidden typing. It saves it only in `.env` with owner-only permissions. Open **http://127.0.0.1:3000** on that computer. Upload a PDF, DOCX or TXT resume, choose your country/city and work arrangement, and select **Start AI job search**.

**Usage is billed by MWAPI**, separately from any ChatGPT subscription. Ensure your MWAPI account has available credits. Each search performs profile analysis, web research where supported, and ranking. Application drafting and form filling use additional model calls. Default model: `claude-sonnet-4-6`.

To use OpenAI instead, run `npm run setup -- --provider=openai`. Its default model is `gpt-4.1`, and OpenAI API billing remains separate from ChatGPT subscriptions.

## What is implemented

- AI resume interpretation, inferred target roles, and necessary follow-up questions.
- Provider web search where supported, plus Remotive and Arbeitnow public feeds. Web-search failure is disclosed; the agent can fall back to feeds.
- Semantic job ranking, match explanations, gaps, and eligibility caveats.
- Country/city and remote preferences; remembered answers and saved jobs.
- AI-written cover letters, tailored summaries, and employer-question answers grounded in your resume.
- Assisted employer browser: AI fills known text fields and selects; you can navigate, upload your original resume, enter missing information, and submit using the live page.
- Application tracker with explicitly self-reported submission status.
- Responsive mobile layout and home-screen web app manifest. No APK is included.

## What is not guaranteed

No service covers the entire web. A sourced posting is not proof it is still open. AI fit scores are estimates, not hiring probabilities. The browser does not bypass logins or CAPTCHAs. Cross-origin embedded forms, some custom controls, bot-protected sites, and pop-up flows may require continuing on the employer's own site. There is no automatic mass submission, background scheduled search, or verified submission-receipt integration. The app never represents a draft or completed form as a submitted application.

## Private deployment

The development server binds to loopback by default. To use it from a phone, deploy the Node service behind an HTTPS reverse proxy, set `HOST=0.0.0.0`, `APP_PASSWORD` to a strong password, and `APP_ORIGIN` to the exact HTTPS origin. Your browser will ask for HTTP Basic credentials; any username with the configured password is accepted. This is one private workspace, not a multi-user SaaS. Add the HTTPS website to your phone's home screen if desired.

A Dockerfile is included. Inject runtime environment values through your hosting platform's secret settings. Never copy `.env` into an image or upload it to a public repository. The included Docker ignore file excludes it. The Chromium application browser requires a Node/container host; it cannot run inside a standard Cloudflare Worker.

## Data and keys

Your resume, preferences, saved jobs, and drafts remain in this browser's local storage. When you start AI operations, resume text and relevant job/application data are sent to the private server and the configured provider (MWAPI and its upstream providers by default). Web-search prompts use professional skills and target roles rather than the raw resume. Provider data-handling policies apply. Optional OpenAI Responses requests use `store:false`; no equivalent retention promise is made for MWAPI. Employer form actions send entered data to that employer. The API key is never sent to the website frontend or included in exported materials. PDF/DOCX parser scripts load from jsDelivr. Use My profile → Delete all local data to clear browser records.

The server keeps one transient employer-browser session. Close it when finished. The application browser shares the single private workspace and is not suitable for public multi-user hosting.

## Verification and current status

- JavaScript syntax checks passed.
- 17 automated backend/security tests passed (schema validation, follow-up flow, URL provenance, source failure handling, application context, private-network blocking, location filters).
- Desktop and mobile browser checks passed with mocked AI responses: profile editing, location persistence, follow-up questions, job cards, saved jobs, application drafts, and responsive layout.
- Assisted Chromium opened a real public HTTPS page successfully.
- MWAPI accepted the supplied key, returned a model catalog, and successfully generated a structured result with `claude-sonnet-4-6`. A live web-search request returned HTTP 502; web search remains unverified and falls back to public feeds on failure. The previous OpenAI key had exhausted credits; the app now defaults to MWAPI.
- Source is prepared for GitHub with a Render deployment blueprint and a private Codespaces configuration. A repository URL is not a live website URL; a hosting service must finish deployment first.

Run checks with `npm run check` and `npm test`. With the server running, `node test/browser-check.mjs` checks the website without calling either AI provider. These tests use fictional sample data and do not apply to any jobs.
