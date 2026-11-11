/**
 * Development seed. Everything here is synthetic — invented postings for invented
 * cohorts. No real company data is scraped or copied.
 */
import type { AcademicYear, ListingType } from '@talea/shared';
import { buildDedupeKey } from '@talea/shared';
import { hashPassword } from './auth.js';
import { config } from './config.js';
import { prisma } from './db.js';
import { serializeEligibility } from './services/listings.js';

function day(offsetDays: number): Date {
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return base;
}

interface SeedListing {
  title: string;
  organisation: string;
  type: ListingType;
  city: string;
  description: string;
  deadline: Date;
  eligibilityYears: AcademicYear[];
}

const LISTINGS: SeedListing[] = [
  {
    title: 'CO-OP Training — Software Engineering',
    organisation: 'Saudi Aramco',
    type: 'coop',
    city: 'Dhahran',
    description:
      'Seven-month cooperative training placement with the digital systems team. Students work on internal tooling, write tests and present a final project to the department. Supervised by a senior engineer.',
    deadline: day(4),
    eligibilityYears: [4, 5],
  },
  {
    title: 'CO-OP Training — Data & Analytics',
    organisation: 'STC',
    type: 'coop',
    city: 'Riyadh',
    description:
      'Join the analytics chapter for a full semester of cooperative training. You will build dashboards, clean datasets and support weekly reporting for the consumer business unit.',
    deadline: day(6),
    eligibilityYears: [4],
  },
  {
    title: 'Graduate Development Programme — Technology',
    organisation: 'NEOM',
    type: 'gdp',
    city: 'NEOM',
    description:
      'Twelve-month graduate development programme rotating across platform engineering, data and cybersecurity. Includes structured mentoring, certifications and a final placement.',
    deadline: day(21),
    eligibilityYears: ['graduate'],
  },
  {
    title: 'CO-OP Training — Mechanical Engineering',
    organisation: 'SABIC',
    type: 'coop',
    city: 'Jubail',
    description:
      'Cooperative training in plant reliability engineering. Students shadow maintenance engineers, support root-cause analysis and document inspection findings.',
    deadline: day(12),
    eligibilityYears: [4, 5],
  },
  {
    title: 'Graduate Development Programme — Finance',
    organisation: 'Al Rajhi Bank',
    type: 'gdp',
    city: 'Riyadh',
    description:
      'An eighteen-month rotational programme for graduates in finance, risk and treasury. Rotations are paired with a professional qualification sponsorship.',
    deadline: day(33),
    eligibilityYears: ['graduate'],
  },
  {
    title: 'CO-OP Training — Cybersecurity',
    organisation: 'Elm',
    type: 'coop',
    city: 'Riyadh',
    description:
      'Cooperative training with the security operations centre. Learn alert triage, incident documentation and secure configuration review alongside the SOC team.',
    deadline: day(2),
    eligibilityYears: [4, 5],
  },
  {
    title: 'CO-OP Training — Civil Engineering',
    organisation: 'Maaden',
    type: 'coop',
    city: 'Ras Al Khair',
    description:
      'Site-based cooperative training supporting infrastructure projects. Students assist with quantity surveys, site inspections and progress reporting.',
    deadline: day(45),
    eligibilityYears: [4],
  },
  {
    title: 'Graduate Development Programme — Supply Chain',
    organisation: 'Almarai',
    type: 'gdp',
    city: 'Buraidah',
    description:
      'Graduate programme covering demand planning, logistics and cold-chain operations. Two rotations across planning and distribution over twelve months.',
    deadline: day(27),
    eligibilityYears: ['graduate'],
  },
  {
    title: 'CO-OP Training — Clinical Nutrition',
    organisation: 'King Faisal Specialist Hospital',
    type: 'coop',
    city: 'Riyadh',
    description:
      'Cooperative training in a hospital nutrition department. Students support patient assessment, menu review and nutrition education sessions under supervision.',
    deadline: day(9),
    eligibilityYears: [4, 5],
  },
  {
    title: 'CO-OP Training — Marketing & Communications',
    organisation: 'Savola Group',
    type: 'coop',
    city: 'Jeddah',
    description:
      'Support the brand team with campaign reporting, content calendars and competitor research. Includes a portfolio project presented to the marketing leadership team.',
    deadline: day(16),
    eligibilityYears: [3, 4],
  },
  {
    title: 'Graduate Development Programme — Engineering',
    organisation: 'ACWA Power',
    type: 'gdp',
    city: 'Dammam',
    description:
      'Graduate programme for electrical and mechanical engineers, rotating through project delivery and operations. Includes site exposure at a renewable energy plant.',
    deadline: day(-5),
    eligibilityYears: ['graduate'],
  },
  {
    title: 'CO-OP Training — UI/UX Design',
    organisation: 'Thiqah',
    type: 'coop',
    city: 'Riyadh',
    description:
      'Cooperative training with a product design team. Students run usability sessions, produce prototypes in Figma and hand off designs to front-end engineers.',
    deadline: day(8),
    eligibilityYears: [3, 4],
  },
  {
    title: 'Graduate Development Programme — Cybersecurity',
    organisation: 'Saudi National Bank',
    type: 'gdp',
    city: 'Riyadh',
    description:
      'Graduate track in security engineering covering threat detection, identity management and secure SDLC. Rotations are paired with a senior security engineer.',
    deadline: day(-2),
    eligibilityYears: ['graduate'],
  },
  {
    title: 'CO-OP Training — Human Resources',
    organisation: 'Zain Saudi Arabia',
    type: 'coop',
    city: 'Riyadh',
    description:
      'Cooperative training in talent acquisition and HR operations. Students support screening logistics, onboarding documentation and employee engagement activities.',
    deadline: day(60),
    eligibilityYears: [3, 4],
  },
];

async function upsertUser(input: {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'admin';
  academicYear: string | null;
}): Promise<void> {
  const passwordHash = await hashPassword(input.password);
  await prisma.user.upsert({
    where: { email: input.email },
    update: { name: input.name, role: input.role, academicYear: input.academicYear },
    create: {
      email: input.email,
      name: input.name,
      role: input.role,
      academicYear: input.academicYear,
      passwordHash,
    },
  });
}

async function main(): Promise<void> {
  await upsertUser({
    email: config.seed.adminEmail,
    password: config.seed.adminPassword,
    name: 'Talea Admin',
    role: 'admin',
    academicYear: null,
  });

  await upsertUser({
    email: config.seed.studentEmail,
    password: config.seed.studentPassword,
    name: 'Noura Al-Harbi',
    role: 'student',
    academicYear: '4',
  });

  for (const listing of LISTINGS) {
    const dedupeKey = buildDedupeKey(listing.organisation, listing.title, listing.deadline);
    await prisma.listing.upsert({
      where: { dedupeKey },
      update: {
        title: listing.title,
        organisation: listing.organisation,
        type: listing.type,
        city: listing.city,
        description: listing.description,
        deadline: listing.deadline,
        eligibilityYears: serializeEligibility(listing.eligibilityYears),
      },
      create: {
        title: listing.title,
        organisation: listing.organisation,
        type: listing.type,
        city: listing.city,
        description: listing.description,
        deadline: listing.deadline,
        eligibilityYears: serializeEligibility(listing.eligibilityYears),
        dedupeKey,
      },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    listings: await prisma.listing.count(),
  };
  console.log(`Seed complete: ${counts.users} users, ${counts.listings} listings.`);
  console.log(`Admin:   ${config.seed.adminEmail} / ${config.seed.adminPassword}`);
  console.log(`Student: ${config.seed.studentEmail} / ${config.seed.studentPassword}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
