import type { PropertyId } from './property';

export interface GeneralView {
  name: string;
  type: string;
}

export type ViewId = string;

export type AnyView = GeneralView;

export interface TableView extends GeneralView {
  type: 'TableView';
  hiddenColumns: PropertyId[];
}

export type ViewMap = { [VIEW_ID: ViewId]: AnyView };
