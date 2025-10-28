import {
  IsString,
  IsNumber,
  IsUrl,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class UploadDocumentRequestDto {
  @IsOptional()
  @IsString()
  originalName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  size?: number;

  // Example of additional optional field (tags, folder, etc.)
  @IsOptional()
  @IsString()
  folder?: string;

  constructor(
    originalName?: string,
    mimeType?: string,
    size?: number,
    folder?: string,
  ) {
    this.originalName = originalName;
    this.mimeType = mimeType;
    this.size = size;
    this.folder = folder;
  }
}

export class UploadDocumentResponseDto {
  @IsString()
  id: string;

  @IsString()
  fileName: string;

  @IsString()
  originalName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  size: number;

  @IsUrl()
  downloadUrl: string;

  @IsDateString()
  uploadedAt: Date;

  constructor(
    id: string,
    fileName: string,
    originalName: string,
    mimeType: string,
    size: number,
    downloadUrl: string,
    uploadedAt: Date,
  ) {
    this.id = id;
    this.fileName = fileName;
    this.originalName = originalName;
    this.mimeType = mimeType;
    this.size = size;
    this.downloadUrl = downloadUrl;
    this.uploadedAt = uploadedAt;
  }
}
export class UploadDocumentErrorDto {
  @IsNumber()
  statusCode: number;

  @IsString()
  message: string;

  @IsString()
  error: string;

  @IsOptional()
  @IsString()
  details?: string;

  constructor(
    statusCode: number,
    message: string,
    error: string,
    details?: string,
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.error = error;
    this.details = details;
  }
}
