export interface UserServicePort {
  createUser(
    name: string,
    lastname: string,
    email: string,
    passwordHash: string,
    active: boolean,
    roleId: string
  ): Promise<{ id: string } | null>;
}
