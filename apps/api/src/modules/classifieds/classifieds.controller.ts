import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ClassifiedsService } from './classifieds.service';
import { UpdateClassifiedDto, UpdateClassifiedStatusDto } from './dto/update-classified.dto';
import { ClassifiedsQueryDto } from './dto/classifieds-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('classifieds')
export class ClassifiedsController {
  constructor(private classifiedsService: ClassifiedsService) {}

  @Public()
  @Get()
  list(@Query() query: ClassifiedsQueryDto) {
    return this.classifiedsService.list(query);
  }

  @Public()
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.classifiedsService.getById(id);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateClassifiedDto) {
    return this.classifiedsService.update(id, user.id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateClassifiedStatusDto,
  ) {
    return this.classifiedsService.updateStatus(id, user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.classifiedsService.remove(id, user.id, user.role);
  }
}
