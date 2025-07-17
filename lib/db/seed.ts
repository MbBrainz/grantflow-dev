// import { stripe } from '../payments/stripe'; // Disabled
import { db } from './drizzle';
import { users, teams, teamMembers } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function createStripeProducts() {
  console.log('Skipping Stripe products creation (Stripe features disabled)');
  // Stripe product creation is disabled to focus on the core grant platform
  /*
  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });
  */
  
  console.log('Skipped Stripe products creation.');
}

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  // Create regular admin user
  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: "owner",
      },
    ])
    .returning();

  console.log('Initial user created.');

  // Create a curator user for testing voting functionality
  const curatorEmail = 'curator@test.com';
  const curatorPassword = 'curator123';
  const curatorPasswordHash = await hashPassword(curatorPassword);

  const [curator] = await db
    .insert(users)
    .values([
      {
        email: curatorEmail,
        passwordHash: curatorPasswordHash,
        role: "curator",
        name: "Test Curator"
      },
    ])
    .returning();

  console.log('Curator user created:', curatorEmail);

  const [team] = await db
    .insert(teams)
    .values({
      name: 'Test Team',
    })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    role: 'owner',
  });

  // Add curator to the team as well
  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: curator.id,
    role: 'member',
  });

  await createStripeProducts();

  console.log('Seed data created successfully.');
  console.log('Admin user:', email, '/ password:', password);
  console.log('Curator user:', curatorEmail, '/ password:', curatorPassword);
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
