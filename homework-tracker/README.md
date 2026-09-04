# Due Today

A calm homework tracker that runs as a static website. It includes email/password and Google sign-in, persistent sessions, class setup, assignment tracking, completion states, an inbox-rule setup prompt, and scheduled homework emails.

## Zero-cost setup

This project deliberately has no required paid service, payment method, or paid hosting plan.

| Need | Free choice used here | Important limit |
| --- | --- | --- |
| Website hosting | GitHub Pages | Public repository/site |
| Accounts and database | Supabase Free | 500 MB database; projects pause after a week without use |
| Google login | Google Cloud OAuth | Free; needs a Google Cloud project and OAuth client |
| Daily email | Google Apps Script + a free Gmail account | Gmail has a daily sending quota, so it suits a small school/personal launch, not unlimited scale |

The scheduler stops when Gmail reports no remaining free email quota. It will not switch to a paid service or incur an overage. The website and database continue to work even if that daily email allowance is spent.

Apple sign-in is purposely not included. Apple requires membership in the Apple Developer Program for Sign in with Apple, which Apple lists at $99/year (unless an eligible institution obtains a waiver). Google and email/password provide the no-cost alternatives.

## Run the visual demo

Open `index.html` in a browser and choose **Preview blank tracker**. It opens with no account, classes, or homework; nothing is pre-filled and no email is sent. This is intentionally only a local preview, not a fake sign-up flow.

For a local server instead:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

## Connect free production accounts

1. Create a free Supabase project. Run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL Editor.
2. In Supabase **Authentication → Providers**, enable Email and Google. In Google Cloud, create a Web OAuth client and add Supabase's callback URL shown by its Google provider setup. Add your public site URL and local URL to Supabase's Redirect URLs.
3. Copy `config.example.js` to `config.js`, then fill in the Supabase project URL and **anon** key. Never put the service-role key in `config.js` or any website file.
4. Create a standalone Google Apps Script project under a free Gmail account you control. Paste in [`google-apps-script/Code.gs`](./google-apps-script/Code.gs). In **Project Settings → Script Properties**, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (from Supabase project API settings). The service-role key belongs only in Script Properties.
5. Run `install` once from Apps Script and accept the requested permissions. This creates a five-minute time trigger. Initial messages are sent on the next trigger run; later daily reminders send at each student’s chosen local time, with `(REMINDER)` in the subject.
6. Put this repository on GitHub and enable **Settings → Pages → Deploy from a branch**. GitHub gives you a free `github.io` address. Add that exact address to Supabase's Auth redirect allow-list.

## Mail behavior

For a new assignment, the first email is:

```text
Subject: HOMEWORK: [class]
You have homework from [class] due [date, including “(tomorrow)” when applicable]. [description]
```

With “Every day until it’s due” selected, later messages are sent at the selected time and use `Subject: (REMINDER) HOMEWORK: [class]`. With “One email per assignment”, the scheduler only sends the first email. Completing or deleting homework prevents future reminders.

## Before sharing widely

The free Gmail sender quota makes this appropriate for a small group. A student with ten active assignments can generate ten emails a day, so test with a few accounts first. If the app outgrows the quota, that is the point to choose whether a paid mail provider is worthwhile—not something the project will do automatically.
