export interface ContextButtonDescription {
  text: string;
  symbolName: string;
}

export type ContextButtonList = Iterable<
  [PropertyKey, ContextButtonDescription]
>;

