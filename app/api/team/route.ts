import { getUser, getUserCommittees } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const committees = await getUserCommittees(user.id);
    
    return Response.json({
      user,
      committees: committees.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        isActive: c.isActive
      }))
    });
  } catch (error) {
    console.error('[Team API]: Error fetching user committees:', error);
    return Response.json({ error: 'Failed to fetch committees' }, { status: 500 });
  }
}
