import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { ReactToPostDto } from './dto/react-to-post.dto';
import { SharePostDto } from './dto/share-post.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  createPost(@CurrentUser() user: any, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(user.id, dto);
  }

  @Get('feed')
  getFeed(@CurrentUser() user: any, @Query() query: FeedQueryDto) {
    return this.postsService.getFeed(query, user.id);
  }

  @Get('user/:userId')
  getUserPosts(
    @CurrentUser() user: any,
    @Param('userId') userId: string,
    @Query() query: FeedQueryDto,
  ) {
    return this.postsService.getUserPosts(userId, query, user.id);
  }

  @Post(':id/reactions')
  reactToPost(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ReactToPostDto) {
    return this.postsService.reactToPost(id, user.id, dto);
  }

  @Post(':id/likes')
  toggleLike(@CurrentUser() user: any, @Param('id') id: string) {
    return this.postsService.toggleLike(id, user.id);
  }

  @Delete(':id/likes')
  removeLike(@CurrentUser() user: any, @Param('id') id: string) {
    return this.postsService.removeLike(id, user.id);
  }

  @Delete(':id/reactions')
  removeReaction(@CurrentUser() user: any, @Param('id') id: string) {
    return this.postsService.removeReaction(id, user.id);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.postsService.getComments(id);
  }

  @Post(':id/comments')
  createComment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CreatePostCommentDto,
  ) {
    return this.postsService.createComment(id, user.id, dto);
  }

  @Delete(':postId/comments/:commentId')
  deleteComment(
    @CurrentUser() user: any,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.postsService.deleteComment(postId, commentId, user.id, user.role);
  }

  @Post(':id/shares')
  sharePost(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: SharePostDto) {
    return this.postsService.sharePost(id, user.id, dto);
  }

  @Get(':id')
  getPost(@CurrentUser() user: any, @Param('id') id: string) {
    return this.postsService.getPost(id, user.id);
  }

  @Delete(':id')
  deletePost(@CurrentUser() user: any, @Param('id') id: string) {
    return this.postsService.deletePost(id, user.id, user.role);
  }
}
