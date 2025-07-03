export function keys(obj: []): number[];
export function keys<T extends object>(obj: T): Array<keyof T>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- overloaded
export function keys(obj: any): any[] {
  if (Array.isArray(obj)) {
    return obj.map((_, index) => index);
  }
  return Object.keys(obj);
}
