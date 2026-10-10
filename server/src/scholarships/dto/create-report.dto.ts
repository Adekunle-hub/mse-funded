import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const reportReasons = ['broken-link', 'wrong-deadline', 'wrong-details', 'looks-fake', 'other'] as const;

export class CreateReportDto {
  @IsIn(reportReasons)
  reason: (typeof reportReasons)[number];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}
