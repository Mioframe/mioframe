import { uid } from 'uid/secure';

export const generateId = <P extends string>(
  prefix: P,
  uidLength: number = 12,
): `${P}${string}` => `${prefix}${uid(uidLength)}`;
