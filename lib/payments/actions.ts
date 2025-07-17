// Payment actions are temporarily disabled
// All payment functionality has been commented out to focus on the core grant platform

/*
'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { withTeam } from '@/lib/auth/middleware';

export const checkoutAction = withTeam(async (formData, team) => {
  const priceId = formData.get('priceId') as string;
  await createCheckoutSession({ team: team, priceId });
});

export const customerPortalAction = withTeam(async (_, team) => {
  const portalSession = await createCustomerPortalSession(team);
  redirect(portalSession.url);
});
*/

// Placeholder exports to prevent import errors
export async function checkoutAction() {
  throw new Error('Payment features are disabled');
}

export async function customerPortalAction() {
  throw new Error('Payment features are disabled');
}
