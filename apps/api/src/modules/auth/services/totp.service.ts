import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaService } from '@repo/database';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

@Injectable()
export class TotpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async setup(userId: string): Promise<{
    secret: string;
    otpauthUrl: string;
    qrCodeDataUrl: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        totpEnabledAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.totpEnabledAt) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: 'Turbo Starter',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });
    const otpauthUrl = totp.toString();
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    const secretBase32 = secret.base32;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: this.encrypt(secretBase32),
        totpEnabledAt: null,
      },
    });

    return { secret: secretBase32, otpauthUrl, qrCodeDataUrl };
  }

  async confirm(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        totpSecret: true,
      },
    });

    if (!user?.totpSecret) {
      throw new BadRequestException('Start TOTP setup before confirming');
    }

    const secret = this.decrypt(user.totpSecret);
    if (!this.verifyCode(secret, code)) {
      throw new BadRequestException('Invalid authentication code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpEnabledAt: new Date(),
      },
    });
  }

  async disable(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        totpEnabledAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.totpEnabledAt) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: null,
        totpEnabledAt: null,
        totpBackupCodes: Prisma.JsonNull,
      },
    });
  }

  async verifyForLogin(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isActive: true,
        totpEnabledAt: true,
        totpSecret: true,
      },
    });

    if (!user?.isActive || !user.totpEnabledAt || !user.totpSecret) {
      throw new UnauthorizedException('Two-factor authentication is not available');
    }

    const secret = this.decrypt(user.totpSecret);
    if (!this.verifyCode(secret, code)) {
      throw new UnauthorizedException('Invalid authentication code');
    }
  }

  private verifyCode(secretBase32: string, code: string): boolean {
    const totp = new OTPAuth.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretBase32),
    });

    const delta = totp.validate({
      token: code.replace(/\s+/g, ''),
      window: 1,
    });

    return delta !== null;
  }

  private encrypt(value: string): string {
    const iv = randomBytes(12);
    const key = this.getEncryptionKey();
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString(
      'base64',
    )}`;
  }

  private decrypt(value: string): string {
    const [ivB64, tagB64, encryptedB64] = value.split(':');
    if (!ivB64 || !tagB64 || !encryptedB64) {
      throw new BadRequestException('Stored TOTP secret is invalid');
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.getEncryptionKey(),
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedB64, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  private getEncryptionKey(): Buffer {
    const rawKey = this.config.getOrThrow<string>('totp.encryptionKey');
    return createHash('sha256').update(rawKey).digest();
  }
}
