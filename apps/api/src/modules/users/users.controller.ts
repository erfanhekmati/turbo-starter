import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionKey } from '@repo/backend-types';
import type { Request } from 'express';
import { CurrentUser, Permissions } from '../auth/decorators';
import type { AuthenticatedUser } from '../auth/types';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions(PermissionKey.USERS_READ)
  @ApiOperation({ summary: 'List users' })
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list({
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      search: query.search,
    });
  }

  @Get(':id')
  @Permissions(PermissionKey.USERS_READ)
  @ApiOperation({ summary: 'Get a user by id' })
  getById(@Param('id') id: string) {
    return this.usersService.getById(id);
  }

  @Patch(':id')
  @Permissions(PermissionKey.USERS_WRITE)
  @ApiOperation({ summary: 'Update a user' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.usersService.update(id, dto, actor, req.ip);
  }

  @Delete(':id')
  @Permissions(PermissionKey.USERS_WRITE)
  @ApiOperation({ summary: 'Deactivate a user' })
  deactivate(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.usersService.deactivate(id, actor, req.ip);
  }
}
