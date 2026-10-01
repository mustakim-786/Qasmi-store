# Admin Panel QA Findings

Live admin checks for `https://qasmi-store.vercel.app`, started 2026-09-30 and continued 2026-10-01.

| ID | Severity | Area | Finding / reproduction | Expected | Actual | Likely cause / next action | Status |
|---|---|---|---|---|---|---|---|
| ADM-001 | P1 | Category/product image upload | Retested product image upload after deploying `cloudinary-sign` and adding the Cloudinary secrets. | Image uploads and shows completed state; public product image loads. | Product B's `public/media/WhatsApp Image 2026-09-30 at 9.22.54 PM (2).jpeg` uploaded successfully to Cloudinary and loaded on its public category page. Product A image upload also succeeded earlier. Category image replacement was not retested. | Keep the function origin allowlist and Cloudinary secrets configured; retest category cover workflow separately. | Product image flow verified on production; category image flow pending. |
| ADM-002 | P1 | Product create | Created active products in both QA categories, with an image and a Standard variant, after earlier video URL failure. | Product saves and is visible in admin and its public category page. | Initial variant insert failed with `WITH ORDINALITY cannot be used with a column definition list`. Fixed `save_product` in production to use `jsonb_array_elements(...) WITH ORDINALITY`; A and B now both save as Active and show publicly. | Keep production function and repository migration aligned. | Fixed and verified live on 2026-10-01. |
| ADM-003 | P2 | Upload error feedback | Same failed category image upload. | Explain the failure reason and offer a useful retry path. | UI displayed only `Failed`; the stored `uploadError` was hidden. | `FileUploadArea` now renders the per-file upload error. | Source fix passes typecheck, lint, and build; production is not deployed, so browser retest is pending. |
| ADM-004 | P2 | Product save error feedback | Same failed Draft product submission. | Show the backend error instead of a generic message. | UI displayed generic `Failed to save product.` | Product form now uses the shared error-message helper. | Source fix passes typecheck, lint, and build; live retest pending. |
| ADM-005 | P2 / launch readiness | Store settings | Opened Admin → Settings and inspected the values. | Real store details should be configured before launch. | Store name and most content/contact fields appeared blank; the WhatsApp field displayed `919876543210`. I did not verify whether that number is the intended business contact. | Store owner should confirm the number and complete intended values after settings save works. No placeholder values were saved. | Partially configured state observed; no changes made. |
| ADM-006 | P2 | Automated test runner | `npm run test` loaded `e2e/storefront.spec.ts` as a Vitest suite. | Vitest should only execute unit tests; Playwright specs run separately. | Playwright emitted “did not expect test() to be called here”; 2 URL unit tests did pass. | Excluded `e2e/**` from Vitest discovery in [`vitest.config.ts`](vitest.config.ts). | Fixed; 2/2 Vitest tests and the 1/1 Playwright test pass. |
| ADM-007 | Test incident | Category delete confirmation | During the delete-confirmation check on the temporary category, the browser's native confirmation dialog became inactive before the attempted dismiss completed. The category then disappeared from both the admin list and its public route. | Cancel should leave the temporary category intact. | Delete operation completed during the check; cancel behavior was not verified. | Recreated the category with the same displayed names and fallback cover, then verified its public route again. The restored row has a new database ID. This was a test incident; do not treat it as a product defect. | Restored and verified. No further delete testing performed. |
| ADM-008 | P1 | Settings save | Entered a temporary store name and pressed Save Settings; reloaded the page afterward to verify persistence. | Settings save should persist and show a success state. | UI displayed `Failed to update settings`; temporary value did not persist. | The singleton row was missing. The production DB now contains the documented blank-default singleton with `ON CONFLICT DO NOTHING`. | Database fix applied; live Settings save retest pending. |
| ADM-009 | P2 | Mobile accessibility / action errors | At 360 px, Products and Categories list screens show icon-only Add/Edit/Delete actions. Product delete failure catch was empty. | Icon-only buttons need accessible names; failed delete should explain failure. | Accessibility tree showed unnamed icon controls; product delete failure was swallowed. | Added localized `aria-label`s and surfaced delete error in an alert; delete dialog now has dialog semantics. | Source fixes pass typecheck, lint, build, and unit suite; production browser retest pending. |
| ADM-010 | P1 | Product variant database insert | Saved Product A with a valid uploaded image and variant; the first submission failed with a Postgres error. | Variant JSON is inserted while preserving array order. | `WITH ORDINALITY` was incorrectly paired with a column definition list for `jsonb_to_recordset`; live DB logs reported `WITH ORDINALITY cannot be used with a column definition list`. | Replaced with `jsonb_array_elements(p_variants) WITH ORDINALITY AS v(value, ordinality)` and extracted variant fields from `v.value`; updated production function and migration. | Fixed; Product A and B saved successfully with variants. |

## Live test data

| Record | State | Notes |
|---|---|---|
| `TEMP QA Category 20260930` | Saved; public | Created to unblock product-form testing. It was accidentally deleted during the delete-dialog check and recreated; it now uses the app's built-in fallback cover because Cloudinary upload failed. Visible at [the category page](https://qasmi-store.vercel.app/category/temp-qa-category-20260930). Not deleted after restoration. |
| `QA_AUTOTEST_CATEGORY_20261001_A` | Saved; public | Created on 2026-10-01 for the user's storefront visibility check. Fallback category image because upload is blocked. |
| `QA_AUTOTEST_CATEGORY_20261001_B` | Saved; public | Created on 2026-10-01 for the user's storefront visibility check. Fallback category image because upload is blocked. |
| `TEMP QA Product 20260930` | Not saved | Draft save attempt failed; no product was visible in Products or Dashboard afterward. |
| `QA AUTOTEST PRODUCT A 20261001` | Saved; Active; public | Category A, ₹99, Standard variant, product image uploaded. Visible at [category A](https://qasmi-store.vercel.app/category/qaautotestcategory20261001a). |
| `QA AUTOTEST PRODUCT B 20261001` | Saved; Active; public | Category B, ₹129, Standard variant, image from `public/media/WhatsApp Image 2026-09-30 at 9.22.54 PM (2).jpeg` uploaded. Public page confirmed both the product card and a successfully loaded Cloudinary image at [category B](https://qasmi-store.vercel.app/category/qaautotestcategory20261001b). |
| Media selection | Upload succeeded | Product B's source image in `public/media` uploaded to Cloudinary; product card image returned a successful browser load. Product A's uploader also showed completion. |

## Checks completed

- Dashboard, Products, Categories, and Settings pages loaded while the admin session was active.
- Category required fields blocked an empty save.
- Product search, category filter, and status filter accepted values and returned the expected empty result state; filters were reset afterward.
- Product form category selector, Draft status, add-variant control, and image/video optimization controls rendered and responded.
- Category creation succeeded; its public category page loaded and showed the expected empty-products state.
- Category update saved successfully for a temporary name, and the original displayed name was restored successfully.
- Initially re-tested the category image upload on 2026-10-01 before Cloudinary secrets were set; it failed. Category image replacement has not been retested after configuring the secrets.
- Recreated and re-verified the temporary category after the test incident documented above.
- Tested the Settings save path with a temporary store-name value; save failed and a reload confirmed the stored value remained blank. No database value changed.
- Category edit form prefilled the saved English/Urdu names and HTTPS fallback URL; Cancel returned to the category list without changing it.
- Mobile checks at 360×800 covered Dashboard, Products, Categories, Settings, and Add Product. Pages rendered and the empty product state and temporary category card remained usable; no clipped content was visible in the inspected screenshots. Wider viewport sweep was inconclusive because route loads had not settled before measurement.
- Created `QA_AUTOTEST_CATEGORY_20261001_A` and `_B`; both appeared in the admin category selector and on the public home page. On 2026-10-01, saved Product A (₹99) in A and Product B (₹129) in B, both Active with Standard variants and Cloudinary images. Admin product list showed both records. Public category A displayed Product A; category B displayed Product B and its image loaded successfully from Cloudinary.
- Product A's first save exposed invalid `WITH ORDINALITY` SQL; repaired the production function and migration, then the retry succeeded.
- Empty product submission focused the first required field and did not submit.
- Invalid `http://` logo URL was blocked with `Logo and social links must use valid HTTPS URLs.` No settings were saved.
- Product form Cancel returned to the product list without creating a record.
- Admin session was active again during this continuation; categories and products routes loaded.
- TypeScript typecheck passed. ESLint reported four existing Fast Refresh warnings and no errors.
- Vitest did not start because the environment returned `spawn EPERM`; the chained build step therefore did not run.
- After running checks outside the restricted subprocess sandbox: TypeScript passed; lint passed with the same four Fast Refresh warnings; production build passed; Vitest passed 2/2 after the config fix; Playwright passed 1/1 existing storefront deep-link check.
- Final `npm run check` passed: typecheck, lint (4 pre-existing warnings), Vitest (3/3), and production build. Final `npm run test:e2e` passed 1/1.
- Added a unit regression test proving failed Cloudinary authorization details render in the uploader; it passes.
- Inspected mobile screenshots at 360×800 for Dashboard, Products, Categories, Settings, and Add Product. Main forms/cards fit the visible content width; Add Product's long form scrolls vertically as expected. At that viewport the production Products/Categories Add controls are icon-only and unnamed in the accessibility tree; source fixes add accessible names but have not been deployed.

## Still to check

- Category delete did remove the temporary record; the delete-confirm dialog's Cancel path was not verified. No further delete testing will be done.
- Retest category cover upload now that Cloudinary secrets are set. Product image upload and product create are verified live in both QA categories.
- Settings save live workflow still needs retesting after the singleton fix. Product edit/delete live workflows remain untested.
- Login failure, logout, unauthenticated direct-route protection, all viewport sizes, and full accessibility keyboard/focus behavior still need dedicated regression checks.

## Pending production actions

- Applied to the confirmed Qasmi production Supabase project on 2026-10-01: inserted the missing `site_settings` singleton and replaced `save_product` to handle empty video URLs. Verified the database function and Settings row.
- Deployed `cloudinary-sign` to the confirmed Qasmi production Supabase project on 2026-10-01. CORS allows `https://qasmi-store.vercel.app` in code while retaining any configured origins. Supabase dashboard showed successful deployment.
- User added `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in Supabase Edge Function secrets on 2026-10-01 (names verified in dashboard; values were not read or exposed). Production image upload subsequently succeeded.
- The existing production QA category `TEMP QA Category 20260930` remains visible. It was created in the production admin, and deletion is not reversible in the app; no cleanup was attempted without deletion approval.
- The Supabase MCP connector still returns permission denied for this project, but the user's logged-in browser dashboard confirmed the exact Qasmi production project and was used for the approved database changes and function deployment.
