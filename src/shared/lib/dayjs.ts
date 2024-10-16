import { default as originDayjs } from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

originDayjs.extend(localizedFormat);

export const dayjs = originDayjs;
