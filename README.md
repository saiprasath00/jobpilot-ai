# Jobpilot — AI job search and application assistant

A mobile-friendly, single-user website using the OpenAI Responses API, web search, and an assisted Chromium application browser.

## Run from GitHub

This repository is private. GitHub Pages cannot run this Node/Chromium application.

### Hosted website: Render + GitHub

1. Open [Render's Blueprint deployment page](https://dashboard.render.com/select-repo?type=blueprint) and connect your GitHub account. Allow access to `saiprasath00/jobpilot-ai`.
2. Select this repository. Render reads `render.yaml` and creates a free Docker web service. Free instances can sleep and are resource-limited; Chromium may require more memory for heavy application pages.
3. Enter your replacement `OPENAI_API_KEY` in Render's private configuration. A strong `APP_PASSWORD` is generated automatically; retrieve it from the service's Environment settings.
4. Open the HTTPS URL Render provides. Use any username and that `APP_PASSWORD` when the browser asks you to sign in.

GitHub pushes will redeploy the service. The API key belongs in Render's secret settings, never in this repository. Adding API credits remains necessary before live AI requests succeed.

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

Setup asks for an OpenAI API key with hidden typing. It saves it only in `.env` with owner-only permissions. Open **http://127.0.0.1:3000** on that computer. Upload a PDF, DOCX or TXT resume, choose your country/city and work arrangement, and select **Start AI job search**.

**OpenAI API billing is separate from a ChatGPT subscription.** Ensure your API project has available credits and appropriate spending limits. Each search performs profile analysis, web research, and ranking. Application drafting and form filling use additional model calls. Default model: `gpt-4.1`; change `OPENAI_MODEL` only to a Responses model supporting web search and structured outputs.

## What is implemented

- AI resume interpretation, inferred target roles, and necessary follow-up questions.
- OpenAI web search plus Remotive and Arbeitnow public feeds.
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

Your resume, preferences, saved jobs, and drafts remain in this browser's local storage. When you start AI operations, resume text and relevant job/application data are sent to the private server and OpenAI. Web-search prompts use professional skills and target roles rather than the raw resume. Responses requests use `store:false`; OpenAI's API data policies still apply. Employer form actions send entered data to that employer. The API key is never sent to the website frontend or included in exported materials. PDF/DOCX parser scripts load from jsDelivr. Use My profile → Delete all local data to clear browser records.

The server keeps one transient employer-browser session. Close it when finished. The application browser shares the single private workspace and is not suitable for public multi-user hosting.

## Verification and current status

- JavaScript syntax checks passed.
- 11 automated backend/security tests passed (schema validation, follow-up flow, URL provenance, source failure handling, application context, private-network blocking, location filters).
- Desktop and mobile browser checks passed with mocked AI responses: profile editing, location persistence, follow-up questions, job cards, saved jobs, application drafts, and responsive layout.
- Assisted Chromium opened a real public HTTPS page successfully.
- The live OpenAI connection test returned HTTP 429 `credit_balance_exhausted` / `insufficient_quota`. Live model generation and real AI web search could not be verified; no further paid requests were attempted.
- Source is prepared for GitHub with a Render deployment blueprint and a private Codespaces configuration. A repository URL is not a live website URL; a hosting service must finish deployment first.

Run checks with `npm run check` and `npm test`. With the server running, `node test/browser-check.mjs` checks the website without calling OpenAI. These tests use fictional sample data and do not apply to any jobs.
