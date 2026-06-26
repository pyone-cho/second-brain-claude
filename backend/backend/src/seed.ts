/**
 * Seed script — populates the database with sample data for development/demo.
 * Run with: npx tsx src/seed.ts
 */

import { v4 as uuidv4 } from 'uuid';
import db from './db.js';
import { runMigrations } from './db.js';
import { encrypt } from './utils/crypto.js';

// ---------------------------------------------------------------------------
// Helper: insert a category and return its row
// ---------------------------------------------------------------------------
async function insertCategory(name: string, color: string, icon: string) {
  await db.execute({
    sql: `INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)`,
    args: [name, color, icon],
  });
  const result = await db.execute({
    sql: 'SELECT * FROM categories WHERE name = ?',
    args: [name],
  });
  return result.rows[0] as unknown as { id: number };
}

// ---------------------------------------------------------------------------
// Helper: insert an item + detail + tags
// ---------------------------------------------------------------------------
async function insertItem(params: {
  type: string;
  status: string;
  pinned?: boolean;
  tags?: string[];
  detailTable: string;
  detailFields: Record<string, unknown>;
}) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const pinned = params.pinned ? 1 : 0;

  const columns = ['item_id', ...Object.keys(params.detailFields)];
  const placeholders = columns.map(() => '?').join(', ');
  const values = [id, ...Object.values(params.detailFields)];

  // Insert item + detail in a batch transaction
  await db.batch([
    {
      sql: `INSERT INTO items (id, type, status, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, params.type, params.status, pinned, now, now] as any[],
    },
    {
      sql: `INSERT INTO ${params.detailTable} (${columns.join(', ')}) VALUES (${placeholders})`,
      args: values as any[],
    },
  ], 'write');

  // Handle tags
  for (const tagName of params.tags || []) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO tags (name) VALUES (?)',
      args: [tagName],
    });
    const tagResult = await db.execute({
      sql: 'SELECT id FROM tags WHERE name = ?',
      args: [tagName],
    });
    const tag = tagResult.rows[0] as unknown as { id: number } | undefined;
    if (tag) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)',
        args: [id, tag.id],
      });
    }
  }

  return id;
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function seed() {
  // Ensure tables exist
  await runMigrations();

  // ---------------------------------------------------------------------------
  // Clear existing data
  // ---------------------------------------------------------------------------
  console.log('🗑️  Clearing existing data...');
  await db.batch([
    { sql: 'DELETE FROM item_tags', args: [] },
    { sql: 'DELETE FROM tags', args: [] },
    { sql: 'DELETE FROM tasks_ordinary', args: [] },
    { sql: 'DELETE FROM tasks_it_infra', args: [] },
    { sql: 'DELETE FROM readings', args: [] },
    { sql: 'DELETE FROM purchases', args: [] },
    { sql: 'DELETE FROM trips', args: [] },
    { sql: 'DELETE FROM items', args: [] },
    { sql: 'DELETE FROM categories', args: [] },
    { sql: "DELETE FROM sqlite_sequence WHERE name IN ('categories', 'tags')", args: [] },
  ], 'write');

  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------
  console.log('📁 Creating categories...');
  const catWork = await insertCategory('Work', '#3B82F6', 'briefcase');
  const catPersonal = await insertCategory('Personal', '#10B981', 'user');
  const catHome = await insertCategory('Home', '#F59E0B', 'home');
  const catHealth = await insertCategory('Health', '#EF4444', 'heart');
  const catFinance = await insertCategory('Finance', '#8B5CF6', 'dollar-sign');
  const catLearning = await insertCategory('Learning', '#06B6D4', 'book-open');

  // ---------------------------------------------------------------------------
  // Tasks (ordinary)
  // ---------------------------------------------------------------------------
  console.log('✅ Creating tasks...');

  // Todo tasks
  await insertItem({
    type: 'task', status: 'todo', pinned: true, tags: ['urgent', 'work'],
    detailTable: 'tasks_ordinary',
    detailFields: {
      category: 'Work', name: 'Prepare Q2 performance report',
      due_date: '2026-07-01', priority: 'high',
    },
  });
  await insertItem({
    type: 'task', status: 'todo', tags: ['personal'],
    detailTable: 'tasks_ordinary',
    detailFields: {
      category: 'Personal', name: 'Renew passport before expiry',
      due_date: '2026-08-15', priority: 'medium',
    },
  });
  await insertItem({
    type: 'task', status: 'todo', tags: ['home'],
    detailTable: 'tasks_ordinary',
    detailFields: {
      category: 'Home', name: 'Fix leaking kitchen faucet',
      due_date: '2026-06-30', priority: 'urgent',
    },
  });
  await insertItem({
    type: 'task', status: 'todo', tags: ['health'],
    detailTable: 'tasks_ordinary',
    detailFields: {
      category: 'Health', name: 'Schedule annual dental checkup',
      due_date: '2026-07-15', priority: 'medium',
    },
  });

  // Process tasks
  await insertItem({
    type: 'task', status: 'process', pinned: true, tags: ['work', 'coding'],
    detailTable: 'tasks_ordinary',
    detailFields: {
      category: 'Work', name: 'Implement user authentication module',
      due_date: '2026-06-28', priority: 'high',
      problem: 'Need to support both JWT and session-based auth for different client types',
    },
  });
  await insertItem({
    type: 'task', status: 'process', tags: ['personal', 'learning'],
    detailTable: 'tasks_ordinary',
    detailFields: {
      category: 'Learning', name: 'Complete TypeScript advanced patterns course',
      due_date: '2026-07-20', priority: 'medium',
      problem: 'Currently on module 6 of 12 — generics and conditional types',
    },
  });

  // Memo tasks
  await insertItem({
    type: 'task', status: 'memo', tags: ['work', 'devops'],
    detailTable: 'tasks_ordinary',
    detailFields: {
      category: 'Work', name: 'Migrate CI/CD pipeline to GitHub Actions',
      priority: 'medium',
      experience: 'Migration took 3 days. Key gotcha: self-hosted runners need Docker-in-Docker for container builds. Saved ~40% on CI costs vs the previous Jenkins setup.',
      note: 'Remember to update the team wiki with the new pipeline docs.',
    },
  });
  await insertItem({
    type: 'task', status: 'memo', tags: ['home'],
    detailTable: 'tasks_ordinary',
    detailFields: {
      category: 'Home', name: 'Paint the living room',
      priority: 'low',
      experience: 'Used Benjamin Moore "Simply White" (OC-117). Two coats over primer. Total cost ~$180 for paint + supplies. Took a full weekend.',
    },
  });

  // ---------------------------------------------------------------------------
  // IT Infra tasks
  // ---------------------------------------------------------------------------
  console.log('🖥️  Creating IT infra tasks...');

  await insertItem({
    type: 'task-it-infra', status: 'todo', pinned: true, tags: ['server', 'production'],
    detailTable: 'tasks_it_infra',
    detailFields: {
      category: 'Work', name: 'Set up production monitoring',
      due_date: '2026-07-05', priority: 'high',
      infra: 'server', item_name: 'prod-web-01', kind: 'Linux',
      description: 'Install and configure Prometheus + Grafana stack for production monitoring',
      url_ip: '192.168.1.100',
      username: 'admin',
    },
  });
  await insertItem({
    type: 'task-it-infra', status: 'todo', tags: ['network'],
    detailTable: 'tasks_it_infra',
    detailFields: {
      category: 'Work', name: 'Configure VPN access for remote team',
      due_date: '2026-07-10', priority: 'medium',
      infra: 'network', item_name: 'corporate-vpn', kind: 'WireGuard',
      description: 'Set up WireGuard VPN with split-tunneling for the remote engineering team',
      url_ip: 'vpn.company.com',
      username: 'vpnadmin',
      password: 'tempVpnPass123!',
    },
  });
  await insertItem({
    type: 'task-it-infra', status: 'process', tags: ['cloud', 'aws'],
    detailTable: 'tasks_it_infra',
    detailFields: {
      category: 'Work', name: 'Migrate S3 buckets to new region',
      due_date: '2026-06-30', priority: 'high',
      infra: 'cloud', item_name: 'AWS S3', kind: 'Object Storage',
      description: 'Moving all S3 buckets from us-east-1 to ap-southeast-1 for data residency compliance',
      url_ip: 's3.ap-southeast-1.amazonaws.com',
      username: 'iam-deploy-role',
      password: 'AKIAIOSFODNN7EXAMPLE',
      new_password: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      remark: 'Use AWS CLI v2 with --recursive flag. Test with a small bucket first.',
    },
  });
  await insertItem({
    type: 'task-it-infra', status: 'memo', tags: ['server'],
    detailTable: 'tasks_it_infra',
    detailFields: {
      category: 'Work', name: 'Upgrade database server RAM',
      priority: 'medium',
      infra: 'server', item_name: 'prod-db-01', kind: 'PostgreSQL',
      description: 'Upgraded from 16GB to 32GB RAM to handle increased query load',
      url_ip: '192.168.1.102',
      username: 'postgres',
      remark: 'Required 15 min downtime during maintenance window (Sunday 3am). Connection pooling (PgBouncer) helped reduce memory pressure.',
    },
  });

  // ---------------------------------------------------------------------------
  // Readings — Books
  // ---------------------------------------------------------------------------
  console.log('📚 Creating reading items...');

  await insertItem({
    type: 'reading-book', status: 'todo', pinned: true, tags: ['programming', 'career'],
    detailTable: 'readings',
    detailFields: {
      title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann',
      priority: 'high', book_name: 'Designing Data-Intensive Applications',
    },
  });
  await insertItem({
    type: 'reading-book', status: 'todo', tags: ['productivity'],
    detailTable: 'readings',
    detailFields: {
      title: 'Building a Second Brain', author: 'Tiago Forte',
      priority: 'medium', book_name: 'Building a Second Brain',
    },
  });
  await insertItem({
    type: 'reading-book', status: 'process', tags: ['programming'],
    detailTable: 'readings',
    detailFields: {
      title: 'Clean Architecture', author: 'Robert C. Martin',
      priority: 'medium', book_name: 'Clean Architecture',
      progress: 45,
      event: 'Chapter 8 — Dependency Inversion Principle',
      knowledge: 'Stable abstractions should not depend on volatile details. Apply the Dependency Inversion Principle at architectural boundaries.',
    },
  });
  await insertItem({
    type: 'reading-book', status: 'memo', tags: ['leadership'],
    detailTable: 'readings',
    detailFields: {
      title: 'The Manager\'s Path', author: 'Camille Fournier',
      priority: 'medium', book_name: 'The Manager\'s Path',
      progress: 100,
      note: 'Excellent guide for engineering managers. Key takeaway: the transition from tech lead to manager requires letting go of coding as your primary identity. Focus on unblocking your team. Recommended for all new engineering managers. Re-read Chapter 5 on giving feedback.',
    },
  });

  // ---------------------------------------------------------------------------
  // Readings — Websites
  // ---------------------------------------------------------------------------
  await insertItem({
    type: 'reading-website', status: 'todo', tags: ['web', 'performance'],
    detailTable: 'readings',
    detailFields: {
      title: 'Core Web Vitals Optimization Guide', author: 'Google Developers',
      url: 'https://web.dev/vitals/', priority: 'medium',
      website_name: 'web.dev',
    },
  });
  await insertItem({
    type: 'reading-website', status: 'process', tags: ['database'],
    detailTable: 'readings',
    detailFields: {
      title: 'SQLite WAL Mode Documentation', author: 'SQLite',
      url: 'https://www.sqlite.org/wal.html', priority: 'low',
      website_name: 'sqlite.org',
      progress: 70,
      knowledge: 'WAL mode allows concurrent readers with a single writer. Checkpointing can be tuned with wal_autocheckpoint pragma.',
    },
  });
  await insertItem({
    type: 'reading-website', status: 'memo', tags: ['devops', 'docker'],
    detailTable: 'readings',
    detailFields: {
      title: 'Docker Multi-Stage Builds Best Practices', author: 'Docker Docs',
      url: 'https://docs.docker.com/build/building/multi-stage/', priority: 'medium',
      website_name: 'docs.docker.com',
      progress: 100,
      note: 'Use alpine base images for final stage. Named stages improve readability. COPY --from=builder only what you need. Reduced image size from 1.2GB to 89MB for our Node.js app.',
    },
  });

  // ---------------------------------------------------------------------------
  // Purchases
  // ---------------------------------------------------------------------------
  console.log('🛒 Creating purchase items...');

  await insertItem({
    type: 'buying', status: 'todo', pinned: true, tags: ['tech', 'upgrade'],
    detailTable: 'purchases',
    detailFields: {
      category: 'Tech', price: 1599.99, priority: 'high',
      desired_usability: 'Primary development machine — need 32GB+ RAM for Docker workloads and local Kubernetes clusters',
      usable_where: 'Home office and co-working space',
    },
  });
  await insertItem({
    type: 'buying', status: 'todo', tags: ['home'],
    detailTable: 'purchases',
    detailFields: {
      category: 'Home', price: 349.99, priority: 'medium',
      desired_usability: 'Better ergonomics for long coding sessions. Current chair causing back pain.',
      usable_where: 'Home office',
    },
  });
  await insertItem({
    type: 'buying', status: 'process', tags: ['tech'],
    detailTable: 'purchases',
    detailFields: {
      category: 'Tech', price: 79.99, priority: 'low',
      desired_usability: 'Mechanical keyboard with Cherry MX Brown switches for quieter typing during meetings',
      usable_where: 'Home office',
    },
  });
  await insertItem({
    type: 'buying', status: 'memo', tags: ['tech'],
    detailTable: 'purchases',
    detailFields: {
      category: 'Tech', price: 249.99, priority: 'medium',
      desired_usability: 'Noise cancelling for focus during deep work sessions',
      usable_where: 'Office, commute, flights',
    },
  });

  // ---------------------------------------------------------------------------
  // Trips
  // ---------------------------------------------------------------------------
  console.log('✈️  Creating trip items...');

  await insertItem({
    type: 'trip', status: 'todo', pinned: true, tags: ['vacation', 'international'],
    detailTable: 'trips',
    detailFields: {
      destination: 'Kyoto, Japan', companions: 'Partner',
      trip_date: '2026-10-15', duration: '7 days', priority: 'high',
      photo_goals: 'Autumn foliage at Kiyomizu-dera, Fushimi Inari at golden hour, bamboo grove in morning light',
    },
  });
  await insertItem({
    type: 'trip', status: 'todo', tags: ['weekend'],
    detailTable: 'trips',
    detailFields: {
      destination: 'Yosemite National Park', companions: 'Friends (4 people)',
      trip_date: '2026-08-20', duration: '3 days', priority: 'medium',
      photo_goals: 'Half Dome sunset, Yosemite Falls, night sky photography from Glacier Point',
    },
  });
  await insertItem({
    type: 'trip', status: 'process', tags: ['work', 'conference'],
    detailTable: 'trips',
    detailFields: {
      destination: 'San Francisco, CA', companions: 'Colleagues (3 people)',
      trip_date: '2026-07-10', duration: '4 days', priority: 'high',
      photo_goals: 'Conference keynote, team dinner photos, Golden Gate Bridge at fog',
      experience: 'Booked flights and hotel. Conference badge pickup confirmed. Meeting up with the SF engineering team on Wednesday.',
    },
  });
  await insertItem({
    type: 'trip', status: 'memo', tags: ['vacation', 'beach'],
    detailTable: 'trips',
    detailFields: {
      destination: 'Bali, Indonesia', companions: 'Family',
      trip_date: '2026-03-10', duration: '10 days', priority: 'medium',
      photo_goals: 'Rice terraces, temple ceremonies, underwater shots at Amed',
      experience: 'Amazing trip! Ubud was the highlight — the Tegallalang rice terraces at sunrise were incredible. Snorkeling at Amed was world-class. Highly recommend staying at least 3 nights in Ubud and 4 in Amed/Sidemen area.',
    },
  });

  // ---------------------------------------------------------------------------
  // Done
  // ---------------------------------------------------------------------------
  const itemsResult = await db.execute('SELECT COUNT(*) as c FROM items');
  const categoriesResult = await db.execute('SELECT COUNT(*) as c FROM categories');
  const tagsResult = await db.execute('SELECT COUNT(*) as c FROM tags');

  const counts = {
    items: (itemsResult.rows[0] as unknown as { c: number }).c,
    categories: (categoriesResult.rows[0] as unknown as { c: number }).c,
    tags: (tagsResult.rows[0] as unknown as { c: number }).c,
  };

  console.log(`\n✅ Seed complete!`);
  console.log(`   📊 ${counts.items} items`);
  console.log(`   📁 ${counts.categories} categories`);
  console.log(`   🏷️  ${counts.tags} tags`);

  process.exit(0);
}

seed();
