import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  async uploadAvatar(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.updateAvatar(user.id, file);
  }

  @Post('me/cover')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  async uploadCover(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.updateCover(user.id, file);
  }

  @Delete('me/cover')
  removeCover(@CurrentUser() user: any) {
    return this.usersService.removeCover(user.id);
  }

  @Get('search')
  searchUsers(@CurrentUser() user: any, @Query() query: SearchUsersQueryDto) {
    return this.usersService.searchUsers(user.id, query);
  }

  @Public()
  @Get('username-availability/:username')
  checkUsernameAvailability(
    @Param('username') username: string,
    @Query('currentUserId') currentUserId?: string,
  ) {
    return this.usersService.checkUsernameAvailability(username, currentUserId);
  }

  @Get('handle/:username')
  getPublicProfileByUsername(@CurrentUser() user: any, @Param('username') username: string) {
    return this.usersService.getPublicProfileByUsername(username, user.id);
  }

  @Get(':id')
  getPublicProfile(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.getPublicProfile(id, user.id);
  }

  @Post(':id/follow')
  followUser(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.followUser(user.id, id);
  }

  @Delete(':id/follow')
  unfollowUser(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.unfollowUser(user.id, id);
  }

  @Get(':id/followers')
  getFollowers(@Param('id') id: string) {
    return this.usersService.getFollowers(id);
  }

  @Get(':id/following')
  getFollowing(@Param('id') id: string) {
    return this.usersService.getFollowing(id);
  }
}
