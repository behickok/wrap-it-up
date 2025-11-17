import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export function requireAdmin(event: Pick<RequestEvent, 'locals'>) {
	if (!event.locals.user || event.locals.user.role !== 'admin') {
		throw redirect(302, '/');
	}
}
