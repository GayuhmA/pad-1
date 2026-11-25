export type ManagementRole = 'admin' | 'panitia';
export type NavbarRightAction = 'resident' | 'dashboard';

export function getManagementRole(role: string | null | undefined): ManagementRole | null {
  const normalized = role?.trim().toLocaleLowerCase('id-ID') ?? '';
  if (normalized.includes('admin')) return 'admin';
  if (normalized.includes('panitia')) return 'panitia';
  return null;
}

export function getPostLoginPath(role: string | null | undefined): string {
  return getManagementRole(role) ? '/dashboard' : '/';
}

export function getNavbarRightAction(role: string | null | undefined): NavbarRightAction {
  return getManagementRole(role) ? 'dashboard' : 'resident';
}

export function canRegisterCompetition(role: string | null | undefined): boolean {
  return Boolean(role) && getManagementRole(role) === null;
}
