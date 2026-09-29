# Qasmi Store

WhatsApp-first storefront for fabrics, perfumes, and related products. It has no cart or card-payment system: customers choose a product and open a prefilled WhatsApp order.

## Local setup

Use Node 22, then copy `.env.example` to `.env.local` and set only the public Vite variables. Install and verify with:

```sh
npm ci
npm run check
npm run test:e2e
```

## Supabase launch checklist

1. Apply migrations in `supabase/migrations` to the intended project. Demo seed data is historical test data; do not apply it to a live store unless wanted.
2. In Supabase Auth, disable public sign-up and add `VITE_SITE_URL/admin/reset-password` to redirect URLs.
3. Create each administrator in the Auth dashboard, then insert that user UUID into `public.admin_users` using the SQL editor/service role. The browser has no admin-management capability.
4. Set Edge Function secrets: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `ALLOWED_ORIGINS` (comma-separated localhost plus the temporary Vercel URL). Deploy both `cloudinary-sign` and `cloudinary-delete` with JWT verification enabled.
5. Rotate the previously exposed Cloudinary API secret before launch. Do not put any Cloudinary secret in an environment file that begins with `VITE_`.
6. Before a custom domain launch, update `VITE_SITE_URL`, Supabase Auth redirect URLs, `ALLOWED_ORIGINS`, and canonical/metadata URLs together.

## Security model

- Public visitors can read categories, settings, and only active/out-of-stock catalog records.
- Draft records are hidden by RLS, including direct URL and search access.
- Admin writes require an authenticated Supabase session whose user ID is listed in `admin_users`.
- Cloudinary signing and deletion run through protected Supabase Edge Functions; the browser receives no Cloudinary secret.
- Vercel response headers provide CSP, HSTS, clickjacking protection, conservative browser permissions, and cache rules.

Deployment, credential rotation, administrator provisioning, and applying migrations are intentionally manual release gates; this repository does not perform those remote actions.
