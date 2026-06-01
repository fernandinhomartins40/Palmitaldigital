import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateCompanyOrderDto, UpdateCompanyOrderStatusDto } from './dto/company-order.dto';

const companyImageInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get('me')
  getMine(@CurrentUser() user: any) {
    return this.companiesService.getMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(user.id, dto);
  }

  @Patch('me')
  updateMine(@CurrentUser() user: any, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.updateMine(user.id, dto);
  }

  @Post('me/logo')
  @UseInterceptors(companyImageInterceptor)
  uploadLogo(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.companiesService.uploadLogo(user.id, file);
  }

  @Delete('me/logo')
  removeLogo(@CurrentUser() user: any) {
    return this.companiesService.removeLogo(user.id);
  }

  @Post('me/cover')
  @UseInterceptors(companyImageInterceptor)
  uploadCover(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.companiesService.uploadCover(user.id, file);
  }

  @Delete('me/cover')
  removeCover(@CurrentUser() user: any) {
    return this.companiesService.removeCover(user.id);
  }

  @Post('me/products')
  addProductMine(@CurrentUser() user: any, @Body() dto: CreateProductDto) {
    return this.companiesService.addProductMine(user.id, dto);
  }

  @Patch('me/products/:id')
  updateProductMine(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateProductDto>,
  ) {
    return this.companiesService.updateProductMine(user.id, id, dto);
  }

  @Post('me/products/:id/image')
  @UseInterceptors(companyImageInterceptor)
  uploadProductImage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.companiesService.uploadProductImage(user.id, id, file);
  }

  @Delete('me/products/:id/image')
  removeProductImage(@CurrentUser() user: any, @Param('id') id: string) {
    return this.companiesService.removeProductImage(user.id, id);
  }

  @Delete('me/products/:id')
  removeProductMine(@CurrentUser() user: any, @Param('id') id: string) {
    return this.companiesService.removeProductMine(user.id, id);
  }

  // ─── Storefront orders ───

  @Post('orders')
  createOrder(@CurrentUser() user: any, @Body() dto: CreateCompanyOrderDto) {
    return this.companiesService.createOrder(user.id, dto);
  }

  @Get('orders/my')
  myOrders(@CurrentUser() user: any) {
    return this.companiesService.listMyOrders(user.id);
  }

  @Get('orders/company')
  companyOrders(@CurrentUser() user: any) {
    return this.companiesService.listCompanyOrders(user.id);
  }

  @Get('orders/:id')
  getOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.companiesService.getOrder(user.id, id);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyOrderStatusDto,
  ) {
    return this.companiesService.updateOrderStatus(user.id, id, dto);
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
