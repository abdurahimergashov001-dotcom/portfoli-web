/* ========================================
   DATABASE — SQLite Setup & Schema
   ======================================== */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'portfolio.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* ---------- CREATE TABLES ---------- */

db.exec(`
  -- Admin users table
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT DEFAULT 'Admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Contact form submissions
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    message TEXT,
    plan TEXT,
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'read', 'replied', 'archived')),
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Reviews / Testimonials
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_name TEXT NOT NULL,
    author_role TEXT,
    author_company TEXT,
    author_initials TEXT,
    author_color TEXT DEFAULT '#6C63FF',
    text TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK(rating >= 1 AND rating <= 5),
    is_visible INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Pricing plans
  CREATE TABLE IF NOT EXISTS pricing_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly INTEGER NOT NULL,
    price_yearly INTEGER NOT NULL,
    is_popular INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Pricing features
  CREATE TABLE IF NOT EXISTS pricing_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    is_included INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (plan_id) REFERENCES pricing_plans(id) ON DELETE CASCADE
  );

  -- FAQ items
  CREATE TABLE IF NOT EXISTS faqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Advantages / Features
  CREATE TABLE IF NOT EXISTS advantages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_svg TEXT,
    icon_color TEXT DEFAULT '#6C63FF',
    sort_order INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Statistics
  CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    value INTEGER NOT NULL,
    suffix TEXT DEFAULT '+',
    sort_order INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Site settings (key-value store)
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Newsletter subscribers
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Projects / Portfolio items
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    image_url TEXT,
    link TEXT,
    technologies TEXT,
    is_featured INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

/* ---------- SEED DEFAULT DATA ---------- */

function seedDatabase() {
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM admins').get();
  
  if (adminExists.count === 0) {
    const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@12345', 12);
    db.prepare('INSERT INTO admins (email, password, name) VALUES (?, ?, ?)').run(
      process.env.ADMIN_EMAIL || 'admin@portfolio.com',
      hashedPassword,
      'Admin'
    );
    console.log('✅ Default admin created');
  }

  // Seed reviews
  const reviewsExist = db.prepare('SELECT COUNT(*) as count FROM reviews').get();
  if (reviewsExist.count === 0) {
    const insertReview = db.prepare(`
      INSERT INTO reviews (author_name, author_role, author_company, author_initials, author_color, text, rating, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedReviews = db.transaction(() => {
      insertReview.run('Alexey Kozlov', 'CEO', 'TechStart', 'AK', '#6C63FF',
        'The result exceeded all expectations! The site turned out not just beautiful, but truly functional. Conversions increased by 40% in the very first month after launch.', 5, 1);
      insertReview.run('Maria Lebedeva', 'Founder', 'Bloom Studio', 'ML', '#FF6584',
        'Professional approach at every stage. All deadlines were met, and communication was top-notch. Highly recommended for serious projects!', 5, 2);
      insertReview.run('Dmitry Sokolov', 'CTO', 'FinFlow', 'DS', '#43E97B',
        'Amazing attention to detail and a deep understanding of UX. Our app became significantly more user-friendly, and users appreciate the modern, pleasant design.', 5, 3);
    });
    seedReviews();
    console.log('✅ Default reviews seeded');
  }

  // Seed pricing plans
  const plansExist = db.prepare('SELECT COUNT(*) as count FROM pricing_plans').get();
  if (plansExist.count === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO pricing_plans (name, description, price_monthly, price_yearly, is_popular, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertFeature = db.prepare(`
      INSERT INTO pricing_features (plan_id, text, is_included, sort_order) VALUES (?, ?, ?, ?)
    `);

    const seedPlans = db.transaction(() => {
      // Basic
      const basic = insertPlan.run('Basic', 'Ideal for landing pages and portfolios', 250, 200, 0, 1);
      insertFeature.run(basic.lastInsertRowid, 'Design up to 5 pages', 1, 1);
      insertFeature.run(basic.lastInsertRowid, 'Responsive layout', 1, 2);
      insertFeature.run(basic.lastInsertRowid, 'Basic SEO optimization', 1, 3);
      insertFeature.run(basic.lastInsertRowid, '1 revision round', 1, 4);
      insertFeature.run(basic.lastInsertRowid, 'Custom animations & microinteractions', 0, 5);
      insertFeature.run(basic.lastInsertRowid, 'Priority support', 0, 6);

      // Professional
      const pro = insertPlan.run('Professional', 'For businesses and startups', 550, 440, 1, 2);
      insertFeature.run(pro.lastInsertRowid, 'Design up to 15 pages', 1, 1);
      insertFeature.run(pro.lastInsertRowid, 'Responsive layout', 1, 2);
      insertFeature.run(pro.lastInsertRowid, 'Advanced SEO optimization', 1, 3);
      insertFeature.run(pro.lastInsertRowid, '3 revision rounds', 1, 4);
      insertFeature.run(pro.lastInsertRowid, 'Custom animations & microinteractions', 1, 5);
      insertFeature.run(pro.lastInsertRowid, 'Priority support', 1, 6);

      // Premium
      const premium = insertPlan.run('Premium', 'Comprehensive digital solutions', 1200, 960, 0, 3);
      insertFeature.run(premium.lastInsertRowid, 'Unlimited pages', 1, 1);
      insertFeature.run(premium.lastInsertRowid, 'Responsive layout', 1, 2);
      insertFeature.run(premium.lastInsertRowid, 'Full SEO + Analytics setup', 1, 3);
      insertFeature.run(premium.lastInsertRowid, 'Unlimited revisions', 1, 4);
      insertFeature.run(premium.lastInsertRowid, 'Exclusive custom animations', 1, 5);
      insertFeature.run(premium.lastInsertRowid, 'Dedicated project manager', 1, 6);
    });
    seedPlans();
    console.log('✅ Default pricing plans seeded');
  }

  // Seed FAQs
  const faqsExist = db.prepare('SELECT COUNT(*) as count FROM faqs').get();
  if (faqsExist.count === 0) {
    const insertFaq = db.prepare('INSERT INTO faqs (question, answer, sort_order) VALUES (?, ?, ?)');
    const seedFaqs = db.transaction(() => {
      insertFaq.run('How long does it take to create a website?',
        'Timelines depend on the project\'s complexity. A landing page usually takes 5-7 working days, a corporate site 2-4 weeks, and complex web apps from 1 month. Exact timelines are discussed after the initial brief.', 1);
      insertFaq.run('What technologies do you use?',
        'I work with a modern tech stack: Figma for design, HTML/CSS/JavaScript for frontend layouts, and React/Next.js for complex interfaces. For CMS, I use WordPress or headless solutions.', 2);
      insertFaq.run('Can I request changes after launch?',
        'Yes, absolutely! All plans include a set number of revision rounds. Ongoing support and further project enhancements are also available via a separate agreement.', 3);
      insertFaq.run('How does payment work?',
        'I work with a 50% upfront payment before starting the project, and the remaining 50% is due after final approval. For larger projects, milestone-based payments are possible.', 4);
      insertFaq.run('Do you provide source files?',
        'Yes, upon project completion, you will receive all design source files (Figma), source code, and comprehensive documentation to manage your site.', 5);
    });
    seedFaqs();
    console.log('✅ Default FAQs seeded');
  }

  // Seed stats
  const statsExist = db.prepare('SELECT COUNT(*) as count FROM stats').get();
  if (statsExist.count === 0) {
    const insertStat = db.prepare('INSERT INTO stats (label, value, suffix, sort_order) VALUES (?, ?, ?, ?)');
    const seedStats = db.transaction(() => {
      insertStat.run('Satisfied clients', 1200, '+', 1);
      insertStat.run('Completed projects', 350, '+', 2);
      insertStat.run('Years of experience', 8, '', 3);
      insertStat.run('Awards and honors', 15, '', 4);
    });
    seedStats();
    console.log('✅ Default stats seeded');
  }

  // Seed advantages
  const advExist = db.prepare('SELECT COUNT(*) as count FROM advantages').get();
  if (advExist.count === 0) {
    const insertAdv = db.prepare('INSERT INTO advantages (title, description, icon_color, sort_order) VALUES (?, ?, ?, ?)');
    const seedAdv = db.transaction(() => {
      insertAdv.run('Unique design', 'No templates — every project is created from scratch, reflecting the individuality of your brand and target audience.', '#6C63FF', 1);
      insertAdv.run('Responsiveness', 'All projects display perfectly on any devices — from mobile phones to widescreen monitors.', '#FF6584', 2);
      insertAdv.run('Fast loading', 'Optimized code and modern technologies ensure lightning-fast website loading speeds.', '#43E97B', 3);
      insertAdv.run('UX-oriented', 'I design interfaces that are intuitively understandable to users and increase business conversion.', '#F9A826', 4);
      insertAdv.run('Clean code', 'Semantic layout, valid HTML/CSS, and best development practices for stable and secure project operations.', '#6C63FF', 5);
      insertAdv.run('24/7 Support', 'Full support after launch: updates, improvements, and prompt resolution of any issues.', '#FF6584', 6);
    });
    seedAdv();
    console.log('✅ Default advantages seeded');
  }

  // Seed settings
  const settingsExist = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (settingsExist.count === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    const seedSettings = db.transaction(() => {
      insertSetting.run('site_title', 'Portfolio — Creative Designer & Developer');
      insertSetting.run('site_description', 'Professional portfolio — I create outstanding digital products, websites and brands.');
      insertSetting.run('hero_title', 'Creating <span class="gradient-text">digital products</span> that inspire');
      insertSetting.run('hero_subtitle', 'Design and development of websites, apps, and brands. Transforming ideas into memorable visual experiences.');
      insertSetting.run('hero_badge', 'Available for new projects');
      insertSetting.run('cta_title', 'Ready to start your project?');
      insertSetting.run('cta_subtitle', 'Leave your email and I will get back to you within 24 hours to discuss the details');
      insertSetting.run('contact_email', 'hello@portfolio.com');
      insertSetting.run('contact_phone', '+1 (234) 567-890');
      insertSetting.run('contact_address', 'New York, USA');
      insertSetting.run('telegram_url', '#');
      insertSetting.run('linkedin_url', '#');
      insertSetting.run('behance_url', '#');
      insertSetting.run('dribbble_url', '#');
    });
    seedSettings();
    console.log('✅ Default settings seeded');
  }
}

module.exports = { db, seedDatabase };
