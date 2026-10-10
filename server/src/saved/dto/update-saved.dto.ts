import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const applicationStatuses = ['interested', 'applying', 'submitted'] as const;

export class UpdateSavedDto {
  @IsOptional()
  @IsIn(applicationStatuses)
  status?: (typeof applicationStatuses)[number];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsOptional()
  @IsBoolean()
  remindersOn?: boolean;
}
