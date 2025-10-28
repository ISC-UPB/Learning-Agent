export class RoleAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`El rol con nombre "${name}" ya existe.`);
    this.name = 'RoleAlreadyExistsError';
  }
}

export class RoleNotFoundError extends Error {
  constructor(id: string) {
    super(`No se encontró el rol con ID "${id}".`);
    this.name = 'RoleNotFoundError';
  }
}

export class PermissionNotFoundError extends Error {
  constructor(ids: string[]) {
    super(`No se encontraron los permisos con IDs: ${ids.join(', ')}`);
    this.name = 'PermissionNotFoundError';
  }
}

export class RoleTransactionError extends Error {
  constructor(message: string) {
    super(`Error en la transacción de rol: ${message}`);
    this.name = 'RoleTransactionError';
  }
}
