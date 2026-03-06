# S3 Studio E2E Tests

These Playwright tests validate the main S3 Studio flow against real storage backends:

- Create profile and verify connection
- Create folder
- Upload file
- Rename file
- Delete file
- Delete folder

## Environment variables

Set either one or both providers. If none are set, tests are skipped.

### Cloudflare R2

- `E2E_R2_ACCESS_KEY_ID`
- `E2E_R2_SECRET_ACCESS_KEY`
- `E2E_R2_REGION`
- `E2E_R2_BUCKET`
- `E2E_R2_ENDPOINT`

### Supabase Storage (S3 endpoint)

- `E2E_SUPABASE_ACCESS_KEY_ID`
- `E2E_SUPABASE_SECRET_ACCESS_KEY`
- `E2E_SUPABASE_REGION`
- `E2E_SUPABASE_BUCKET`
- `E2E_SUPABASE_ENDPOINT`

## Local run

From repo root:

```bash
pnpm --filter @s3-studio/web test:e2e:install
pnpm --filter @s3-studio/web test:e2e
```

The test runner will build `@s3-studio/opendal-wasm` and start the app server automatically when `E2E_BASE_URL` is not provided.
