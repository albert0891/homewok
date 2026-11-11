# Setup

One-time setup for running Homewok on the iOS Simulator: Xcode, a Supabase project, Google sign-in, and the `.env.local` file. Do the parts in order. It takes about 30 minutes.

Nothing here is pasted into a chat or committed to git. The four values in `.env.local` are public identifiers that ship inside the app. The database password, the Supabase secret key, and the Google client secret stay in a password manager or in the dashboards.

## 1. Xcode

1. Install Xcode from the App Store.
2. Open Xcode once, agree to the license, and install the **iOS** platform when it asks. That download includes the iOS Simulator.
3. Point the command line tools at Xcode:

   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

CocoaPods, the tool that downloads iOS native libraries, is installed with `brew install cocoapods`.

## 2. Supabase project

1. Sign in at https://supabase.com and create a project named `homewok` on the Free plan, in a region near home. Let it generate the database password and save that in a password manager.
2. Open **Connect** at the top of the project page (or **Project Settings > API Keys**). Copy two values into `.env.local`:
   - Project URL, which looks like `https://abcdefgh.supabase.co`, into `EXPO_PUBLIC_SUPABASE_URL`.
   - The **publishable** key, which starts with `sb_publishable_`, into `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Never copy the **secret** key (`sb_secret_`). The app refuses to start if it finds one.

A free project pauses after about a week without use. Restore it from the dashboard.

## 3. Google Cloud

1. Open https://console.cloud.google.com and create a project named `Homewok`.
2. Open **Google Auth Platform** and choose **Get started**. App name `Homewok`, your own email for support and contact, audience **External**.
3. **Audience > Test users:** add your own Google account. While the app is in Testing, only the accounts on this list can sign in. Add family members here later.
4. **Data Access > Add or remove scopes:** tick `openid`, `.../auth/userinfo.email`, and `.../auth/userinfo.profile`, then save.
5. **Clients > Create client**, type **Web application**, name `Homewok web`. Leave the origins and redirect URIs empty. Create it, then:
   - Copy the **Client ID** into `.env.local` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
   - Keep the page open. The **Client secret** is only shown now, and step 4 needs it.
6. **Clients > Create client**, type **iOS**, name `Homewok iOS`, bundle ID `com.albert.homewok`. Copy its **Client ID** into `.env.local` as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.

Both client IDs end with `.apps.googleusercontent.com`.

## 4. Google provider in Supabase

In the Supabase dashboard, open **Authentication > Sign In / Providers > Google**.

1. Turn on **Enable Sign in with Google**.
2. **Client IDs:** the web client ID, a comma, then the iOS client ID, with no spaces. The web one must come first.
3. **Client Secret:** paste the web client's secret straight from the Google page.
4. Turn on **Skip nonce checks**. The free Google sign-in library cannot pass a nonce on iOS, so Supabase would reject every sign-in without this. See `docs/decisions.md`.
5. Save.

## 5. Build and run

```bash
npm install
```

```bash
npm run ios
```

The first build takes ten minutes or more. It compiles a development build, installs it on the Simulator, and starts the dev server. After that, `npm start` is enough for changes to TypeScript files.

Rebuild after anything native changes: a new native library, `app.config.ts`, or `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.

```bash
npx expo prebuild --platform ios --clean
```

```bash
npm run ios
```

## When sign-in fails

The app shows "Couldn't sign in." The reason is printed in the terminal that runs the dev server.

| What you see | Likely cause |
| ------------ | ------------ |
| Red screen listing `EXPO_PUBLIC_` names | `.env.local` is missing a value. Fill it in and restart `npm start`. |
| "missing support for the following URL schemes" | The iOS client ID was added after the app was built. Rebuild. |
| "Passed nonce and nonce in id_token should either both exist or not" | **Skip nonce checks** is off in Supabase. |
| "Unacceptable audience in id_token" | **Client IDs** in Supabase does not list both client IDs, web first. |
| Google page says access is blocked | The Google account is not in **Test users**. |
