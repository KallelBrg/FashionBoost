import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StoreService } from '../store/store.service';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly storeService: StoreService,
  ) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateProductDto) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.productService.create(store.id, dto);
  }

  @Get()
  async findAll(@Request() req) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.productService.findAll(store.id);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.productService.findOne(id, store.id);
  }

  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.productService.update(id, store.id, dto);
  }

  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (_, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
          cb(null, unique + extname(file.originalname));
        },
      }),
      fileFilter: (_, file, cb) => {
        if (!file.mimetype.match(/image\/(jpeg|png|webp)/)) {
          return cb(new Error('Apenas imagens JPEG, PNG ou WEBP são permitidas'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @Request() req,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    const imageUrl = `/uploads/products/${file.filename}`;
    return this.productService.update(id, store.id, { imageUrl });
  }

  @Delete(':id/image')
  async removeImage(@Request() req, @Param('id') id: string) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.productService.removeImage(id, store.id);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const store = await this.storeService.findByTenant(req.user.tenantId);
    return this.productService.remove(id, store.id);
  }
}
