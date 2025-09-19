import { environment } from '../../environments/environment';

export function makeImageUrl(path?: string | null): string {
  if (!path) return '';
  let p = path.replace(/\\/g, '/');
  if (/^https?:\/\//i.test(p)) return p;
  if (!p.startsWith('/')) p = '/' + p;
  return `${environment.FILES_BASE}${p}`;
}
