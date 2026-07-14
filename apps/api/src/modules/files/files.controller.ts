import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionKey } from '@repo/backend-types';
import type { Request } from 'express';
import { CurrentUser, Permissions } from '../auth/decorators';
import type { AuthenticatedUser } from '../auth/types';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { ListFilesQueryDto } from './dto/list-files-query.dto';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { StorageService } from './storage.service';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presign')
  @Permissions(PermissionKey.FILES_WRITE)
  @ApiOperation({ summary: 'Create a presigned S3 upload URL' })
  presign(
    @Body() dto: PresignUploadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.storageService.createPresignedUpload({
      mimeType: dto.mimeType,
      size: dto.size,
      fileName: dto.fileName,
      userId: user.id,
    });
  }

  @Post('complete')
  @Permissions(PermissionKey.FILES_WRITE)
  @ApiOperation({ summary: 'Persist metadata after a successful upload' })
  complete(
    @Body() dto: CompleteUploadDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.storageService.completeUpload({
      key: dto.key,
      mimeType: dto.mimeType,
      size: dto.size,
      originalName: dto.originalName,
      actor: user,
      ip: req.ip,
    });
  }

  @Get()
  @Permissions(PermissionKey.FILES_READ)
  @ApiOperation({ summary: 'List files' })
  list(
    @Query() query: ListFilesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const isAdmin = user.roles.includes('ADMIN');
    return this.storageService.list({
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      userId: isAdmin ? undefined : user.id,
    });
  }

  @Get(':id')
  @Permissions(PermissionKey.FILES_READ)
  @ApiOperation({ summary: 'Get file metadata' })
  getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.storageService.getById(id, user);
  }

  @Delete(':id')
  @Permissions(PermissionKey.FILES_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    await this.storageService.delete(id, user, req.ip);
  }
}
