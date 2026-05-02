ALTER TABLE "PostComment" ADD COLUMN "parentId" TEXT;

CREATE TABLE "PostCommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostCommentLike_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PostCommentReaction" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PostReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostCommentReaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PostComment_parentId_idx" ON "PostComment"("parentId");

CREATE UNIQUE INDEX "PostCommentLike_commentId_userId_key" ON "PostCommentLike"("commentId", "userId");
CREATE INDEX "PostCommentLike_commentId_idx" ON "PostCommentLike"("commentId");
CREATE INDEX "PostCommentLike_userId_idx" ON "PostCommentLike"("userId");

CREATE UNIQUE INDEX "PostCommentReaction_commentId_userId_key" ON "PostCommentReaction"("commentId", "userId");
CREATE INDEX "PostCommentReaction_commentId_idx" ON "PostCommentReaction"("commentId");
CREATE INDEX "PostCommentReaction_userId_idx" ON "PostCommentReaction"("userId");
CREATE INDEX "PostCommentReaction_type_idx" ON "PostCommentReaction"("type");

ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostCommentLike" ADD CONSTRAINT "PostCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostCommentLike" ADD CONSTRAINT "PostCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostCommentReaction" ADD CONSTRAINT "PostCommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostCommentReaction" ADD CONSTRAINT "PostCommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
