import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1, { message: 'Enter your full name' })
  @MaxLength(100)
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Enter an email like name@example.com' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Use at least 8 characters' })
  @MaxLength(72, { message: 'Use at most 72 characters' })
  password: string;
}
