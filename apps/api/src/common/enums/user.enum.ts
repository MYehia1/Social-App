/**
 * String enums rather than numeric ones.
 *
 * These previously stored 0/1 in MongoDB, which made documents unreadable in
 * Compass, made adding a value in the middle a migration hazard, and meant
 * `GenderEnum.MALE` was falsy — so `if (user.gender)` silently misbehaved.
 */
export enum GenderEnum {
  MALE = 'male',
  FEMALE = 'female',
}

export enum RoleEnum {
  USER = 'user',
  ADMIN = 'admin',
}

export enum ProviderEnum {
  SYSTEM = 'system',
  GOOGLE = 'google',
}
