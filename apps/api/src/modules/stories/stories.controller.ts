import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoriesService } from './stories.service';

@Controller('stories')
export class StoriesController {
  constructor(private storiesService: StoriesService) {}

  @Get('feed')
  getStoryFeed(@CurrentUser() user: any) {
    return this.storiesService.getStoryFeed(user.id);
  }

  @Post()
  createStory(@CurrentUser() user: any, @Body() dto: CreateStoryDto) {
    return this.storiesService.createStory(user.id, dto);
  }

  @Get('user/:userId')
  getUserStories(@CurrentUser() user: any, @Param('userId') userId: string) {
    return this.storiesService.getUserStories(user.id, userId);
  }

  @Post(':id/view')
  markViewed(@CurrentUser() user: any, @Param('id') id: string) {
    return this.storiesService.markViewed(id, user.id);
  }

  @Delete(':id')
  deleteStory(@CurrentUser() user: any, @Param('id') id: string) {
    return this.storiesService.deleteStory(id, user.id, user.role);
  }
}
