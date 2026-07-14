import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PermissionKey } from '@repo/backend-types';
import { PrismaService } from '@repo/database';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl?: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.bucket = this.config.getOrThrow<string>('s3.bucket');
    this.publicUrl = this.config.get<string>('s3.publicUrl');
    this.client = new S3Client({
      endpoint: this.config.getOrThrow<string>('s3.endpoint'),
      region: this.config.getOrThrow<string>('s3.region'),
      forcePathStyle: this.config.get<boolean>('s3.forcePathStyle') ?? true,
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('s3.accessKey'),
        secretAccessKey: this.config.getOrThrow<string>('s3.secretKey'),
      },
    });
  }

  async createPresignedUpload(params: {
    mimeType: string;
    size: number;
    fileName: string;
    userId: string;
  }) {
    const key = `uploads/${params.userId}/${randomUUID()}-${params.fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: params.mimeType,
      ContentLength: params.size,
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 900,
    });

    return {
      uploadUrl,
      key,
      bucket: this.bucket,
      publicUrl: this.publicUrl ? `${this.publicUrl}/${key}` : undefined,
    };
  }

  async completeUpload(params: {
    key: string;
    mimeType: string;
    size: number;
    originalName: string;
    actor: AuthenticatedUser;
    ip?: string;
  }) {
    const file = await this.prisma.fileObject.create({
      data: {
        key: params.key,
        bucket: this.bucket,
        mimeType: params.mimeType,
        size: params.size,
        originalName: params.originalName,
        uploadedById: params.actor.id,
        publicUrl: this.publicUrl
          ? `${this.publicUrl}/${params.key}`
          : null,
      },
    });

    await this.auditService.log({
      actorUserId: params.actor.id,
      action: 'file.upload',
      entityType: 'FileObject',
      entityId: file.id,
      metadata: { key: params.key, mimeType: params.mimeType },
      ip: params.ip,
    });

    return file;
  }

  async list(params: { page: number; pageSize: number; userId?: string }) {
    const where = params.userId ? { uploadedById: params.userId } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.fileObject.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.fileObject.count({ where }),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async getById(id: string, actor: AuthenticatedUser) {
    const file = await this.prisma.fileObject.findUnique({ where: { id } });
    if (!file) {
      throw new NotFoundException('File not found');
    }
    const canReadAll = actor.permissions.includes(PermissionKey.FILES_READ);
    if (file.uploadedById !== actor.id && !canReadAll) {
      throw new ForbiddenException();
    }
    return file;
  }

  async delete(id: string, actor: AuthenticatedUser, ip?: string) {
    const file = await this.getById(id, actor);
    const canWrite =
      file.uploadedById === actor.id ||
      actor.permissions.includes(PermissionKey.FILES_WRITE);

    if (!canWrite) {
      throw new ForbiddenException();
    }

    await this.client.send(
      new DeleteObjectCommand({ Bucket: file.bucket, Key: file.key }),
    );
    await this.prisma.fileObject.delete({ where: { id } });
    await this.auditService.log({
      actorUserId: actor.id,
      action: 'file.delete',
      entityType: 'FileObject',
      entityId: id,
      ip,
    });
  }
}
