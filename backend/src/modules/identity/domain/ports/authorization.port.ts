export interface AuthorizationPort {
  getRolesForUser(userId: string): Promise<string[]>;
  hasRole(userId: string, roleName: string): Promise<boolean>;
  hasPermission(userId: string, action: string, resource: string): Promise<boolean>;
  requiresRole(userId: string, roleName: string): Promise<void>;
  requiresPermission(userId: string, action: string, resource: string): Promise<void>;
}
