export interface HasherPort {
  hash(value: string): Promise<string>;
}