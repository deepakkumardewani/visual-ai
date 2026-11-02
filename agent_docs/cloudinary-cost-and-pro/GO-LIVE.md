# Go-live checklist: separate Cloudinary cloud for dev, e2e and staging

Production (`ddzuitkzt`) must only appear in `.env.production*` files. Everything else uses a second free cloud.

## Owner steps

1. Create a second free Cloudinary account (the dev cloud). Optional: set a 70% usage alert in its console.
2. Note its cloud name, API key and API secret.
3. Repoint each file below to the dev cloud:
   - `apps/web/.env.local`: `VITE_CLOUDINARY_BASE_URL` (and `VITE_CLOUDINARY_ASSETS_URL` until Phase 4 removes it)
   - `apps/web/.env.staging`: same vars
   - `apps/web/.env.e2e*` (including `.env.e2e-preview`, `.env.e2e.local`): same vars
   - `apps/api/.env`: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, keep `CLOUDINARY_BASE_PATH=private/development/uploads`
   - `apps/api/.env.staging`: same vars
4. Re-upload or accept that old production-hosted reference images will not validate against the dev cloud.
5. Run the leak check and confirm exit code 0:

   ```
   node apps/web/scripts/check-cloudinary-env.mjs; echo $?
   ```

6. Upload an image in a dev session and confirm it appears in the dev cloud, not production.

The script exits 1 and names each non-production env file that still contains `ddzuitkzt`.
