import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(user.id, dto);
  }

  @Public()
  @Get()
  list(@Query('city') city?: string, @Query('category') category?: string) {
    return this.companiesService.list(city, category);
  }

  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.companiesService.getBySlug(slug);
  }

  @Patch(':slug')
  update(@CurrentUser() user: any, @Param('slug') slug: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(slug, user.id, dto);
  }

  @Post(':slug/products')
  addProduct(@CurrentUser() user: any, @Param('slug') slug: string, @Body() dto: CreateProductDto) {
    return this.companiesService.addProduct(slug, user.id, dto);
  }

  @Patch(':slug/products/:id')
  updateProduct(
    @CurrentUser() user: any,
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateProductDto>,
  ) {
    return this.companiesService.updateProduct(slug, id, user.id, dto);
  }

  @Delete(':slug/products/:id')
  removeProduct(@CurrentUser() user: any, @Param('slug') slug: string, @Param('id') id: string) {
    return this.companiesService.removeProduct(slug, id, user.id);
  }
}
