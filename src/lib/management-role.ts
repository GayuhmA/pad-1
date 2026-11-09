export type ManagementRole = 'admin' | 'panitia';

export function getManagementRole(role: string | null | undefined): ManagementRole | null {
  const normalized = role?.trim().toLocaleLowerCase('id-ID') ?? '';
  if (normalized.includes('admin')) return 'admin';
  if (normalized.includes('panitia')) return 'panitia';
  return null;
}

export function getPostLoginPath(role: string | null | undefined): string {
  return getManagementRole(role) ? '/dashboard' : '/';
}
