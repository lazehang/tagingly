export type ISODateString = string;

export type UserRole = "SUPERADMIN" | "ORGANIZER" | "USER";

export type EventOrganizerRole = "OWNER" | "ORGANIZER";

export type PhotoStatus = "PENDING" | "PROCESSED" | "FAILED";

export type TagKind = "proposed" | "confirmed";

export interface EventDto {
  id: string;
  name: string;
  date: ISODateString;
  allowUserDownloads: boolean;
  createdById?: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface EventOrganizerDto {
  id: string;
  eventId: string;
  eventName?: string;
  userId: string;
  name: string;
  email: string;
  role: EventOrganizerRole;
  createdAt: ISODateString;
}

export interface UserSelfieDto {
  id: string;
  storageKey: string;
  url?: string;
  createdAt: ISODateString;
}

export interface UserPublicDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  eventId: string | null;
  selfieKey: string | null;
  selfieUrl?: string;
  selfies?: UserSelfieDto[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface TaggedUserDto {
  id: string;
  name: string;
  email: string;
  certainty?: number;
  tagKind: TagKind;
}

export interface PhotoDto {
  id: string;
  eventId: string;
  storageKey: string;
  proposedUserIds: string[];
  confirmedUserIds: string[];
  status: PhotoStatus;
  photoUrl?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PhotoDetailDto extends PhotoDto {
  taggedUsers: TaggedUserDto[];
}

export interface UserPhotosResponse {
  photos: PhotoDto[];
  allowUserDownloads: boolean;
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
  event?: Pick<EventDto, "id" | "name" | "allowUserDownloads">;
}

export interface ClientErrorBody {
  error: string;
  code?: string;
}

export interface EventUserSearchResult {
  id: string;
  name: string;
  email: string;
}
