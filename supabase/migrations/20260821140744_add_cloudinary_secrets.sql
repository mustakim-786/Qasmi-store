/*
# Store Cloudinary credentials securely

A single-row table holding Cloudinary API credentials.
Only the service role (used by edge functions) can read this — 
anon/authenticated roles are denied by RLS.
*/

CREATE TABLE IF NOT EXISTS app_secrets (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cloudinary_cloud_name text NOT NULL DEFAULT '',
  cloudinary_api_key text NOT NULL DEFAULT '',
  cloudinary_api_secret text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;

-- Deny all access from anon and authenticated (service role bypasses RLS)
DROP POLICY IF EXISTS "no_anon_access_secrets" ON app_secrets;
CREATE POLICY "no_anon_access_secrets" ON app_secrets
  FOR SELECT TO anon, authenticated USING (false);

INSERT INTO app_secrets (id, cloudinary_cloud_name, cloudinary_api_key, cloudinary_api_secret)
VALUES (1, '', '', '')
ON CONFLICT (id) DO UPDATE SET
  cloudinary_cloud_name = EXCLUDED.cloudinary_cloud_name,
  cloudinary_api_key = EXCLUDED.cloudinary_api_key,
  cloudinary_api_secret = EXCLUDED.cloudinary_api_secret,
  updated_at = now();
