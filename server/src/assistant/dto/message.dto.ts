import { IsString, MaxLength, MinLength } from 'class-validator';

export class MessageDto {
  @IsString()
  @MinLength(1, { message: 'Write a message' })
  @MaxLength(8000, { message: 'Keep your message under 8,000 characters, or attach the document as a file' })
  message: string;
}
