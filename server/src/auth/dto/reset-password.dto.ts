import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(20, { message: 'This reset link is invalid or has expired' })
  @MaxLength(200)
  token: string;

  @IsString()
  @MinLength(8, { message: 'Use at least 8 characters' })
  @MaxLength(72)
  password: string;
}
