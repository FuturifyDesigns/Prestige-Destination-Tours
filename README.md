# Prestige Destination Tours

A React and GSAP website for tailored Botswana safaris, river cruises, wilderness adventures, and transfers. Enquiries and booking requests are saved to Supabase and reviewed from the staff inbox. Booking availability is confirmed by the Prestige team by email.

## Run locally

Use Node.js 22. Run `npm install` and `npm run dev`. To verify the production build, run `npm run build`, then `npm run preview`.

## Connect Supabase

1. In the intended Supabase project, apply the SQL file under `supabase/migrations/` once through the SQL Editor or your existing Supabase migration workflow.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in a local `.env.local` file. For GitHub Actions add the same values under repository **Settings → Secrets and variables → Actions → Variables**. Use the project URL and a browser publishable key (or legacy anon key). Keep personal access tokens and service-role keys out of the site.
3. Create the intended staff account in **Authentication → Users**. In the SQL Editor, assign the staff role by replacing the example UUID with that account’s actual UUID.

   ```sql
   update auth.users
   set raw_app_meta_data =
     coalesce(raw_app_meta_data, '{}'::jsonb) || '{"prestige_staff":true}'::jsonb
   where id = '00000000-0000-0000-0000-000000000000'::uuid;
   ```

4. Open **Staff sign-in** in the footer or use `/#/admin` relative to the project URL. After granting staff access, sign in again to refresh the session.
5. Submit a sample enquiry and booking request, open them in the staff inbox, change a status, and check that **Reply by email** opens a draft for the submitted address. Verify with a non-staff account that requests are unavailable. The public form has a honeypot and database validation. If abuse occurs, add server-side rate limiting or CAPTCHA verification before accepting public writes.

Public visitors can submit requests. Staff can read requests and change their status. **Reply by email** opens the staff member’s mail client. The website does not send automated email or collect payments.

## Publish to GitHub Pages

Put the project contents at the root of `FuturifyDesigns/Prestige-Destination-Tours` and push to `main`. In GitHub, choose **Settings → Pages → Source → GitHub Actions** and check the **Deploy to GitHub Pages** run. The project uses relative asset paths and hash routing to work on the repository’s Pages URL.

The transparent logo and favicon are in `public/`. Web-optimized Safari illustrations and supplied shuttle photographs are used throughout the site.
