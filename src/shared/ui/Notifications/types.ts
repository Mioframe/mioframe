export enum COLOR {
  link,
  primary,
  info,
  success,
  warning,
  danger,
}

export interface Notification {
  header?: string;
  message: string;
  timeout?: number;
  color?: COLOR;
}
