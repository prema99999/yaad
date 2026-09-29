# Yaad — real Google Photos MVP setup

You'll do three things: (1) create a Google OAuth client, (2) get a free Gemini API key,
(3) deploy to Vercel (free). About 15-20 minutes total. No coding required.

## 1. Google Cloud setup (~7 min)

1. Go to https://console.cloud.google.com/ and create a new project (any name).
2. In the search bar, find **"Google Photos Picker API"** and click **Enable**.
3. Go to **APIs & Services → OAuth consent screen**.
   - User type: **External**.
   - Fill in app name, your email, developer contact email.
   - Scopes: click "Add or remove scopes", search for `photospicker`, add
     `.../auth/photospicker.mediaitems.readonly`.
   - Test users: add your own Google account email (required while the app is unverified).
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Leave Authorized JavaScript origins empty for now — you'll add it after step 3 below,
     once you know your Vercel URL.
   - Click Create. **Copy the Client ID** (looks like `123-abc.apps.googleusercontent.com`).
     You do NOT need the client secret for this app.

## 2. Free Gemini API key (~2 min, no credit card)

1. Go to https://aistudio.google.com/app/apikey and sign in with Google.
2. Click **Create API key** and copy it (starts with `AIza`).
3. It goes into Vercel's environment variables (step 3), never into the page code.
4. Free tier has low per-minute limits, so the app describes photos one at a time (about 1 every 7 seconds). Pick 10-20 photos, not hundreds.
5. Privacy note: on Google's free tier, prompts and photos you send may be used to improve Google's products. Use non-sensitive photos for testing.
6. If you get a "model not found" error, open AI Studio, check the current Flash model name, and add it in Vercel as `GEMINI_MODEL` (default is `gemini-2.5-flash`).

## 3. Deploy to Vercel (~7 min)

**Easiest path (no git needed):**
1. Go to https://vercel.com/ and sign up (free).
2. Install the CLI once: in a terminal, run `npm i -g vercel` (requires Node.js installed).
3. In this folder, run `vercel` and follow the prompts (link/create a project, accept defaults).
4. After it deploys, run `vercel env add GEMINI_API_KEY` and paste your key when asked.
   Choose "Production" (and "Preview"/"Development" too, if asked).
5. Run `vercel --prod` again to redeploy with the environment variable applied.
6. Vercel prints your live URL, e.g. `https://photofind-live.vercel.app`.

**Alternative:** push this folder to a GitHub repo and import it at vercel.com/new —
same environment variable step applies in the project's Settings → Environment Variables.

## 4. Connect Google Cloud to your deployed URL (~2 min)

1. Back in Google Cloud Console → your OAuth client → edit it.
2. Under **Authorized JavaScript origins**, add your Vercel URL exactly
   (e.g. `https://photofind-live.vercel.app`, no trailing slash).
3. Save.

## 5. Use it

1. Open your Vercel URL.
2. Paste your Google **Client ID** (from step 1) into the box at the top and click Save.
3. Click **Connect Google Photos** → sign in → a picker window opens showing your real
   Google Photos library → select photos → click Done.
4. Wait a few seconds while each photo gets an AI description (shown under the thumbnail).
5. Type a fuzzy description in the search box and hit Search.

## Notes / known limitations (also on your Risks slide)

- Each connect session is separate — Google's photospicker scope doesn't allow persisting
  access to your whole library between visits, only what you explicitly pick each time.
  This is a Google platform restriction, not a bug.
- The app is in "Testing" mode in Google Cloud, so only accounts you added as test users
  can sign in. That's fine for demoing to your 3 test users — just add their emails too
  (OAuth consent screen → Test users), or use your own account for the demo.
- Photo thumbnails' URLs expire after about an hour — reconnect if they stop loading after
  a long gap.
