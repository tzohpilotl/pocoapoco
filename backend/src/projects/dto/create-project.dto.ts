import { IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  projectStatusId!: string;
}
