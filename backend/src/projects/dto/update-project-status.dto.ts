import { IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateProjectStatusDto {
  @IsUUID()
  projectStatusId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
