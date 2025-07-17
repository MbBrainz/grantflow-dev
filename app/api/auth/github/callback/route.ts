import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers, activityLogs } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: string,
  ipAddress?: string
) {
  if (teamId === null || teamId === undefined) {
    return;
  }
  const newActivity = {
    teamId,
    userId,
    action: type,
    ipAddress: ipAddress || ''
  };
  await db.insert(activityLogs).values(newActivity);
}

export async function GET(request: NextRequest) {
  console.log('[github_callback]: Processing GitHub OAuth callback');
  
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    console.log('[github_callback]: OAuth error', error);
    return NextResponse.redirect(new URL('/sign-in?error=oauth_error', request.url));
  }

  if (!code || !state) {
    console.log('[github_callback]: Missing code or state parameters');
    return NextResponse.redirect(new URL('/sign-in?error=missing_params', request.url));
  }

  // Verify state parameter
  const storedState = request.cookies.get('oauth_state')?.value;
  if (state !== storedState) {
    console.log('[github_callback]: Invalid state parameter');
    return NextResponse.redirect(new URL('/sign-in?error=invalid_state', request.url));
  }

  try {
    // Exchange code for access token
    console.log('[github_callback]: Exchanging code for access token');
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.log('[github_callback]: Failed to get access token', tokenData);
      return NextResponse.redirect(new URL('/sign-in?error=token_error', request.url));
    }

    // Fetch user data from GitHub
    console.log('[github_callback]: Fetching user data from GitHub');
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const githubUser = await userResponse.json();
    console.log('[github_callback]: GitHub user data received', { id: githubUser.id, login: githubUser.login });

    // Fetch user emails to get primary email
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const emails = await emailsResponse.json();
    const primaryEmail = emails.find((email: any) => email.primary)?.email || githubUser.email;

    console.log('[github_callback]: Primary email found', primaryEmail);

    // Check if user exists by githubId first, then by email
    let existingUser = await db
      .select()
      .from(users)
      .where(eq(users.githubId, githubUser.id.toString()))
      .limit(1);

    if (existingUser.length === 0 && primaryEmail) {
      existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, primaryEmail))
        .limit(1);
    }

    let user;
    let isNewUser = false;

    if (existingUser.length > 0) {
      // Update existing user with GitHub info
      console.log('[github_callback]: Updating existing user with GitHub info');
      user = existingUser[0];
      
      await db
        .update(users)
        .set({
          githubId: githubUser.id.toString(),
          name: user.name || githubUser.name || githubUser.login,
          email: primaryEmail || user.email,
        })
        .where(eq(users.id, user.id));
        
      // Update user object with new data
      user = {
        ...user,
        githubId: githubUser.id.toString(),
        name: user.name || githubUser.name || githubUser.login,
        email: primaryEmail || user.email,
      };
    } else {
      // Create new user
      console.log('[github_callback]: Creating new user');
      isNewUser = true;
      
      const [createdUser] = await db
        .insert(users)
        .values({
          email: primaryEmail,
          name: githubUser.name || githubUser.login,
          githubId: githubUser.id.toString(),
          role: 'member', // Default role for GitHub users
        })
        .returning();

      user = createdUser;

      // Create a team for new users (following existing pattern)
      const [createdTeam] = await db
        .insert(teams)
        .values({
          name: `${githubUser.login}'s Team`,
        })
        .returning();

      if (createdTeam) {
        await db
          .insert(teamMembers)
          .values({
            userId: user.id,
            teamId: createdTeam.id,
            role: 'owner',
          });

        await logActivity(createdTeam.id, user.id, 'SIGN_UP');
      }
    }

    console.log('[github_callback]: Setting session for user', { userId: user.id });
    
    // Set session using existing auth system
    await setSession(user);

    // Log activity
    if (!isNewUser) {
      const userWithTeam = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, user.id))
        .limit(1);

      if (userWithTeam.length > 0) {
        await logActivity(userWithTeam[0].teamId, user.id, 'SIGN_IN');
      }
    }

    // Get redirect URL
    const redirectTo = request.cookies.get('oauth_redirect')?.value || '/dashboard';

    console.log('[github_callback]: Redirecting to', redirectTo);

    // Create response with redirect
    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    
    // Clean up OAuth cookies
    response.cookies.delete('oauth_state');
    response.cookies.delete('oauth_redirect');

    return response;

  } catch (error) {
    console.error('[github_callback]: Error during OAuth callback', error);
    return NextResponse.redirect(new URL('/sign-in?error=server_error', request.url));
  }
} 