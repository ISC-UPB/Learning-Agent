export interface RoleServicePort {
  findRoleByName(name: string): Promise<{ id: string } | null>;
}
