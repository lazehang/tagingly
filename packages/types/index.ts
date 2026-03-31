export type ISODateString = string;

export type UserRole = "ADMIN" | "USER";

export type PhotoStatus = "PENDING" | "PROCESSED" | "FAILED";

export interface EventDto {
  id: string;
  name: string;
  date: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface UserPublicDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  eventId: string | null;
  selfieKey: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PhotoDto {
  id: string;
  eventId: string;
  storageKey: string;
  taggedUserIds: string[];
  status: PhotoStatus;
  photoUrl?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserPublicDto;
}

export interface AuthMeResponse {
  user: UserPublicDto;
}

export interface ClientErrorBody {
  error: string;
  code?: string;
}
