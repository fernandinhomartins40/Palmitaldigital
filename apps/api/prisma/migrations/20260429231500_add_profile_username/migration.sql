ALTER TABLE "Profile"
ADD COLUMN "username" TEXT;

UPDATE "Profile"
SET "username" =
  LEFT(
    COALESCE(
      NULLIF(
        BTRIM(REGEXP_REPLACE(LOWER("displayName"), '[^a-z0-9]+', '_', 'g'), '_'),
        ''
      ),
      'user'
    ),
    15
  ) || '_' || SUBSTRING(MD5("userId") FROM 1 FOR 8)
WHERE "username" IS NULL;

ALTER TABLE "Profile"
ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");
