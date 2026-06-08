import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsArray, IsBoolean, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { PollType } from '../../common/enums/poll-type.enum';

export class CreatePollDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: PollType })
  @IsEnum(PollType)
  type: PollType;

  @ApiProperty({ type: [Object] })
  @IsArray()
  options: { name: string; description?: string; imageUrl?: string }[];

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  maxVotesPerUser?: number;
}
