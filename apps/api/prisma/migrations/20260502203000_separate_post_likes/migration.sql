CREATE TABLE "PostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PostLike" ("id", "postId", "userId", "createdAt")
SELECT
    'like_' || md5("postId" || ':' || "userId"),
    "postId",
    "userId",
    "createdAt"
FROM "PostReaction"
WHERE "type" = 'LIKE'
ON CONFLICT DO NOTHING;

DELETE FROM "PostReaction"
WHERE "type" = 'LIKE';

CREATE UNIQUE INDEX "PostLike_postId_userId_key" ON "PostLike"("postId", "userId");
CREATE INDEX "PostLike_postId_idx" ON "PostLike"("postId");
CREATE INDEX "PostLike_userId_idx" ON "PostLike"("userId");

ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
