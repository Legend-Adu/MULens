import { createClient } from '@supabase/supabase-js';

function getServerConfig() {
  return {
    supabaseUrl:
      process.env.VITE_SUPABASE_URL ||
      'https://ggblwkqprciadgdxibip.supabase.co',
    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    adminSecretKey:
      process.env.ADMIN_SECRET_KEY || ''
  };
}

const BUCKET_NAME = 'mulens-media';
const EVENTS_FILE_PATH = 'site-config/events.json';

function getAdminClient() {
  const { supabaseUrl, serviceRoleKey } = getServerConfig();

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured in server environment variables.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

// Default initial events used on initial reset or seeding
const DEFAULT_EVENTS = [
  {
    id: 'evt-spring-music-fest',
    title: 'Alpha Spring Acoustic Night & Campus Live Concert',
    date: 'MAY 15, 2026',
    day: '15',
    month: 'MAY',
    year: '2026',
    time: '5:30 PM - 10:00 PM',
    location: 'Main University Amphitheater & Green Lawn',
    venueDetail: 'Open Air Amphitheater Stage A',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop',
    category: 'Music Concert',
    categoryClass: 'bg-danger-subtle text-danger border-danger-subtle',
    organizer: 'MU Music Club & Cultural Affairs',
    organizerLogo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=150&auto=format&fit=crop',
    organizerRole: 'Official Student Music Society',
    description: 'Experience an electrifying sunset-to-starlight musical evening featuring 8 student indie bands, university chamber orchestra soloists, and headlining guest acoustic artists under the open campus sky.',
    highlights: [
      '8 live performances from student rock, folk & indie acoustic bands',
      'Food trucks, photo booths & neon glow merchandise stalls',
      'Special acoustic reunion set with university alumni musicians'
    ],
    audience: 'Open for All Students, Faculty & Staff',
    entryFee: 'Free Entry with Student ID',
    registrationUrl: 'https://musicclub.university.edu/spring2026',
    registrationDeadline: 'May 14, 2026',
    status: 'Registration Open',
    contactEmail: 'events@alphacommunity.edu',
    contactPhone: '+880 1700-123456'
  },
  {
    id: 'evt-ncpc-hackathon',
    title: 'National Collegiate Programming Contest (NCPC) & Hackathon',
    date: 'MAY 22, 2026',
    day: '22',
    month: 'MAY',
    year: '2026',
    time: '9:00 AM - 6:00 PM',
    location: 'CSE Department Innovation Labs',
    venueDetail: 'Lab 301, 302 & Computing Center',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
    category: 'Tech & Coding',
    categoryClass: 'bg-info-subtle text-info border-info-subtle',
    organizer: 'CSE Society & ACM Student Chapter',
    organizerLogo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=150&auto=format&fit=crop',
    organizerRole: 'Department Technical Society',
    description: 'The premier university coding battle where 60+ algorithmic teams compete in dynamic problem solving, data structures, and algorithmic logic under ICPC-standard contest rules.',
    highlights: [
      '5-hour ICPC format algorithmic problem solving contest',
      'Cash prizes, medals, and national certificate of merit',
      'Industry tech talks & networking lunch with software recruiters'
    ],
    audience: 'Enrolled CSE / EEE / STEM Undergraduates',
    entryFee: 'Free for Department Teams',
    registrationUrl: 'https://csesociety.edu/ncpc2026',
    registrationDeadline: 'May 19, 2026',
    status: 'Registration Open',
    contactEmail: 'contest@csesociety.edu',
    contactPhone: '+880 1800-987654'
  },
  {
    id: 'evt-inter-dept-sports',
    title: 'Inter-Department Football & Athletics Tournament Finals',
    date: 'MAY 28, 2026',
    day: '28',
    month: 'MAY',
    year: '2026',
    time: '2:30 PM - 7:00 PM',
    location: 'University Sports Stadium',
    venueDetail: 'Main Football Arena & Running Track',
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop',
    category: 'Sports & Athletics',
    categoryClass: 'bg-success-subtle text-success border-success-subtle',
    organizer: 'University Sports Board & Athletics Club',
    organizerLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=150&auto=format&fit=crop',
    organizerRole: 'University Athletics Board',
    description: 'The adrenaline-fueled climax of the semester sports tournament as finalists clash for the Grand Chancellor Trophy, accompanied by marching band fanfares.',
    highlights: [
      'Final championship match: CSE Titans vs. BBA Mavericks',
      '4x100m relay sprint sprint-offs and medal ceremonies',
      'Live stadium commentary and cheerleader cheer-offs'
    ],
    audience: 'Open for All Campus Supporters & Alumni',
    entryFee: 'Free Entry (Open Seating)',
    registrationUrl: 'https://sports.university.edu/finals',
    registrationDeadline: 'Walk-in Welcome',
    status: 'Upcoming',
    contactEmail: 'sports@university.edu',
    contactPhone: '+880 1900-554433'
  },
  {
    id: 'evt-cultural-fest',
    title: 'Annual Campus Cultural Gala & Theater Showcase',
    date: 'JUN 04, 2026',
    day: '04',
    month: 'JUN',
    year: '2026',
    time: '4:00 PM - 9:30 PM',
    location: 'Main Auditorium & Quadrangle',
    venueDetail: 'Grand Auditorium Stage 1',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
    category: 'Cultural & Arts',
    categoryClass: 'bg-warning-subtle text-warning border-warning-subtle',
    organizer: 'Cultural Club & English Drama Society',
    organizerLogo: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?q=80&w=150&auto=format&fit=crop',
    organizerRole: 'Student Performing Arts Council',
    description: 'A vibrant celebration of traditional and contemporary performing arts, featuring student-directed theatrical plays, folk musical ensembles, and poetry slams.',
    highlights: [
      'Original 2-act play: "Echoes of the Quad" written by English Dept students',
      'Classical & contemporary fusion dance recitals',
      'Traditional attire photo booth and campus food fair'
    ],
    audience: 'All University Students, Faculty & Families',
    entryFee: 'Free Admission',
    registrationUrl: 'https://culturalclub.edu/gala2026',
    registrationDeadline: 'June 02, 2026',
    status: 'Registration Open',
    contactEmail: 'cultural@university.edu',
    contactPhone: '+880 1711-223344'
  },
  {
    id: 'evt-ai-robotics-workshop',
    title: 'AI, Generative Models & Robotics Hands-on Seminar',
    date: 'JUN 11, 2026',
    day: '11',
    month: 'JUN',
    year: '2026',
    time: '10:00 AM - 3:30 PM',
    location: 'EEE & Robotics Engineering Hub',
    venueDetail: 'Seminar Hall B & Embedded Systems Lab',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop',
    category: 'Workshop & Seminar',
    categoryClass: 'bg-primary-subtle text-primary border-primary-subtle',
    organizer: 'Robotics Society & IEEE Student Branch',
    organizerLogo: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=150&auto=format&fit=crop',
    organizerRole: 'Engineering Technical Chapter',
    description: 'An interactive masterclass and hardware hack workshop exploring computer vision, autonomous navigation with microcontrollers, and modern LLM edge integrations.',
    highlights: [
      'Hands-on microcontroller programming and computer vision tracking',
      'Guest keynote by leading robotics research scientist',
      'Certificate of participation and kit provided for attendees'
    ],
    audience: 'Students interested in AI, Hardware & Coding',
    entryFee: 'Free (Seat Cap: 80 Participants)',
    registrationUrl: 'https://robotics.university.edu/workshop',
    registrationDeadline: 'June 08, 2026',
    status: 'Limited Seats Left',
    contactEmail: 'robotics@university.edu',
    contactPhone: '+880 1733-445566'
  },
  {
    id: 'evt-club-carnival',
    title: 'University Club Carnival & Autumn Recruitment Drive',
    date: 'JUN 18, 2026',
    day: '18',
    month: 'JUN',
    year: '2026',
    time: '10:00 AM - 5:00 PM',
    location: 'Heritage Quad & Walkway Pavilions',
    venueDetail: 'All Quadrangle Gazebos & Lawn Stalls',
    imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1200&auto=format&fit=crop',
    category: 'Recruitment & Carnival',
    categoryClass: 'bg-info-subtle text-info border-info-subtle',
    organizer: 'Office of Student Affairs & Clubs Council',
    organizerLogo: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=150&auto=format&fit=crop',
    organizerRole: 'Central Student Governance',
    description: 'Explore over 25 registered campus clubs — spanning photography, debating, computing, music, social service, robotics, and sports — all in one lively festival.',
    highlights: [
      'On-the-spot registration booths for 25+ official clubs and societies',
      'Interactive games, quizzes, and club merchandise giveaways',
      'Live music and orientation briefings for new students'
    ],
    audience: 'Open for All Enrolled Students & Freshers',
    entryFee: 'Free Entry & Open Walk-In',
    registrationUrl: 'https://clubs.university.edu/carnival',
    registrationDeadline: 'Walk-in Welcome',
    status: 'Upcoming',
    contactEmail: 'studentaffairs@university.edu',
    contactPhone: '+880 1755-667788'
  }
];

async function loadExistingEvents(supabaseAdmin: any): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET_NAME).download(EVENTS_FILE_PATH);
    if (error || !data) {
      return [];
    }
    const text = await data.text();
    const parsed = JSON.parse(text || '[]');
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    return [];
  }
}

async function saveEventsToStorage(supabaseAdmin: any, events: any[]): Promise<boolean> {
  const buffer = Buffer.from(JSON.stringify(events, null, 2));
  const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).upload(
    EVENTS_FILE_PATH,
    buffer,
    { upsert: true, contentType: 'application/json' } as any
  );
  if (error) {
    throw new Error(`Failed to upload events to storage: ${error.message}`);
  }
  return true;
}

export async function handler(event: any) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-secret',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok' }) };
  }

  // Allow public GET to fetch events
  if (event.httpMethod === 'GET') {
    try {
      const supabaseAdmin = getAdminClient();
      const events = await loadExistingEvents(supabaseAdmin);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, events })
      };
    } catch (err: any) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, events: [] })
      };
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let payload: any = {};
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
  }

  const { action, event: eventData, eventId, events: allEvents } = payload;

  // Handle public get via POST
  if (action === 'get') {
    try {
      const supabaseAdmin = getAdminClient();
      const events = await loadExistingEvents(supabaseAdmin);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, events })
      };
    } catch (err: any) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, events: [] })
      };
    }
  }

  // All modification actions require admin verification
  const { serviceRoleKey, adminSecretKey } = getServerConfig();
  if (!serviceRoleKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not configured.' }) };
  }
  if (!adminSecretKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration: ADMIN_SECRET_KEY not configured.' }) };
  }

  const requestAdminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'] || (event.headers['authorization'] ? event.headers['authorization'].replace('Bearer ', '') : '');

  if (!requestAdminSecret || requestAdminSecret !== adminSecretKey) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized: Invalid or missing x-admin-secret header.' })
    };
  }

  try {
    const supabaseAdmin = getAdminClient();
    let currentEvents = await loadExistingEvents(supabaseAdmin);

    // Support both 'create' and 'add'
    if (action === 'create' || action === 'add') {
      if (!eventData || !eventData.title) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Event title and data are required.' }) };
      }

      const newId = eventData.id || `evt-${Date.now()}`;
      const newEvent = {
        ...eventData,
        id: newId
      };

      currentEvents.unshift(newEvent);
      await saveEventsToStorage(supabaseAdmin, currentEvents);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, action: 'create', event: newEvent, events: currentEvents })
      };
    }

    if (action === 'update') {
      if (!eventData || !eventData.id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Event ID and data are required.' }) };
      }

      const idx = currentEvents.findIndex(e => String(e.id) === String(eventData.id));
      if (idx === -1) {
        currentEvents.unshift(eventData);
      } else {
        currentEvents[idx] = { ...currentEvents[idx], ...eventData };
      }

      await saveEventsToStorage(supabaseAdmin, currentEvents);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, action: 'update', event: eventData, events: currentEvents })
      };
    }

    if (action === 'delete') {
      const targetId = eventId || (eventData && eventData.id);
      if (!targetId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Target event ID is required for deletion.' }) };
      }

      currentEvents = currentEvents.filter(e => String(e.id) !== String(targetId));
      await saveEventsToStorage(supabaseAdmin, currentEvents);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, action: 'delete', deletedId: targetId, events: currentEvents })
      };
    }

    if (action === 'reset') {
      currentEvents = [...DEFAULT_EVENTS];
      await saveEventsToStorage(supabaseAdmin, currentEvents);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, action: 'reset', events: currentEvents })
      };
    }

    if (action === 'save_all' && Array.isArray(allEvents)) {
      await saveEventsToStorage(supabaseAdmin, allEvents);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, action: 'save_all', events: allEvents })
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
  } catch (err: any) {
    console.error('[manage-events Exception]:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Server error' }) };
  }
}
