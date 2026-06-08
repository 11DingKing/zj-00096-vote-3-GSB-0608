import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsArray, IsOptional, IsString } from 'class-validator';

export class VoteOptionDto {
  @ApiProperty()
  @IsNumber()
  optionId: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  rankValue?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  ratingValue?: number;
}

export class VoteDto {
  @ApiProperty({ type: [VoteOptionDto] })
  @IsArray()
  votes: VoteOptionDto[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  browserFingerprint?: string;
}
