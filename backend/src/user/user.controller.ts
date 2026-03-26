import { Body, Controller, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@Request() req) {
    return this.userService.findMe(req.user.id);
  }

  @Patch('me')
  updateMe(@Request() req, @Body() dto: UpdateUserDto) {
    return this.userService.update(req.user.id, dto);
  }

  @Get()
  listUsers(@Request() req) {
    return this.userService.findAllByTenant(req.user.tenantId);
  }

  @Post()
  createEmployee(@Request() req, @Body() dto: CreateEmployeeDto) {
    return this.userService.createEmployee(req.user.tenantId, dto);
  }
}
