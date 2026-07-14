import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionKey } from '@repo/backend-types';
import { Permissions } from '../auth/decorators';
import { AuditService } from './audit.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions(PermissionKey.AUDIT_READ)
  @ApiOperation({ summary: 'List audit log entries' })
  list(@Query() query: ListAuditLogsQueryDto) {
    return this.auditService.list({
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      entityType: query.entityType,
    });
  }
}
