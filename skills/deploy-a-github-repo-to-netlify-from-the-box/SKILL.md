---
name: deploy-a-github-repo-to-netlify-from-the-box
description: "Use this when a static site in a GitHub repo needs a free Netlify account, a continuous-deploy site, env vars, Netlify Forms email notifications, or a check on visitor access, done through the box browser."
---
# Deploy a GitHub repo to Netlify (box browser)

## Known gotchas
- Netlify email sign-up REJECTS bot inbox domains ("Email domain @mail.grokbot.com is not supported"). Sign up with GitHub instead; it also grants repo access in one go.
- If the user signs in to GitHub on the box mid-OAuth (e.g. via "Continue with Google"), Netlify often shows "Authentication Error: Invalid state key". That only means the OAuth state expired: GitHub is now signed in, so just restart "Sign up with GitHub"; it goes straight through.
- New Netlify projects can default to **Visitor access > Project visibility = Private** (production and previews). The public then gets 401 and a redirect to app.netlify.com/edge-access. Switching to Public is available on the Free plan. Keep it Private until the owner approves going live.
- Form notification emails stay "awaiting recipient confirmation" until the recipient clicks the confirm link Netlify emails. That link is a JS page: curl does nothing, so open it in the browser.

## Steps
1. Check the vault for a GitHub login. If none, the user signs in to GitHub on the box (Secure Form or hand over the screen; many users sign in with Google, which needs the screen handoff).
2. computerUse: open https://app.netlify.com/signup, choose Sign up with GitHub, authorize, answer onboarding (personal use, team name), and decline any paid plan or trial. Stop at "Deploy your first project".
3. computerUse: Import from GitHub. When installing the Netlify GitHub app, choose "Only select repositories" and pick just the target repo. Set branch, build command and publish directory (Astro: `npm run build`, `dist`), and the project name, then deploy.
4. Project configuration > Environment variables: add needed vars for all contexts (e.g. `SITE_URL=https://<name>.netlify.app`), then Deploys > Trigger deploy.
5. Forms: enable form detection, redeploy, then add an Email notification for the named form. Read the confirmation email in that inbox and open the confirm link in the browser.
6. Verify from Shell with `curl -s -o /dev/null -w '%{http_code}'` on /, /robots.txt, /sitemap-index.xml, /llms.txt. A 401 means visitor access is Private.
7. Tell the site's engineering owner the site URL, site id, build settings, env vars and the form setup.
