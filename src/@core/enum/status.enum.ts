import { tuple } from '@/utils';

export enum StatusEnum {
  'PENDING' = 'PENDING',
  'ACTIVE' = 'ACTIVE',
  'INACTIVE' = 'INACTIVE',
  'DELETED' = 'DELETED',
}
export const StatusArray: string[] = [...Object.values(StatusEnum)];
export const AppStatusEnum = tuple(...StatusArray);
export type StatusType = keyof typeof StatusEnum;
export const StatusList = [
  { label: 'Active', value: StatusEnum.ACTIVE },
  { label: 'Inactive', value: StatusEnum.INACTIVE },
];
