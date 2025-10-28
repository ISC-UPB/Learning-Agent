export class Role {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description?: string | null,
    public readonly permissions: { id: string; name: string }[] = [],
  ) {}
}
