import { IsBoolean, IsIn, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = 'Write the deadline as YYYY-MM-DD';
const URL_OPTIONS = { require_protocol: true, protocols: ['http', 'https'] };

export const listingStatuses = ['PUBLISHED', 'UNDER_REVIEW', 'REJECTED'] as const;
export const sourceKinds = ['HTML', 'LISTING'] as const;

export class ApproveDto {
  @IsOptional()
  @IsUrl(URL_OPTIONS, { message: 'Enter a full link starting with https://' })
  officialUrl?: string;

  @IsOptional()
  @Matches(DATE, { message: DATE_MESSAGE })
  deadline?: string | null;
}

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  name?: string;

  @IsOptional()
  @IsUrl(URL_OPTIONS, { message: 'Enter a full link starting with https://' })
  officialUrl?: string;

  @IsOptional()
  @Matches(DATE, { message: DATE_MESSAGE })
  deadline?: string | null;

  @IsOptional()
  @IsIn(listingStatuses)
  status?: (typeof listingStatuses)[number];
}

export class CreateSourceDto {
  @IsUrl(URL_OPTIONS, { message: 'Enter a full link starting with https://' })
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsIn(sourceKinds)
  kind: (typeof sourceKinds)[number];
}

export class UpdateSourceDto {
  @IsBoolean()
  isActive: boolean;
}

export function toDeadline(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  return value === null ? null : new Date(`${value}T23:59:59Z`);
}
