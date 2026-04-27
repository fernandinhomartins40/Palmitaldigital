import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  createPost(@CurrentUser() user: any, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(user.id, dto);
  }

  @Get('feed')
  getFeed(@Query() query: FeedQueryDto) {
    return this.postsService.getFeed(query);
  }

  @Get('user/:userId')
  getUserPosts(@Param('userId') userId: string, @Query() query: FeedQueryDto) {
    return this.postsService.getUserPosts(userId, query);
  }

  @Get(':id')
  getPost(@Param('id') id: string) {
    return this.postsService.getPost(id);
  }

  @Delete(':id')
  deletePost(@CurrentUser() user: any, @Param('id') id: string) {
    return this.postsService.deletePost(id, user.id, user.role);
  }
}
