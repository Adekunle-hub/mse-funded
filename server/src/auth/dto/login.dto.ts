import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Enter an email like name@example.com' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Enter your password' })
  @MaxLength(72)
  password: string;
}
