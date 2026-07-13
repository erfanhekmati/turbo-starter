import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './user.response.dto';

export function toUserResponseDto(user: object): UserResponseDto {
  return plainToInstance(UserResponseDto, user, {
    excludeExtraneousValues: true,
  });
}
