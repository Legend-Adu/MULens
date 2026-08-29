/**
 * MULens - Central Application Data & Information Store
 * 
 * You can manually edit, add, or customize all website information in this file!
 * Change text, images, categories, memories, photographers, events, and site configurations.
 */

export interface SiteConfig {
  appName: string;
  archiveBadge: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  trendingTags: { label: string; tag: string }[];
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  caption?: string;
}

export interface StatItem {
  id: string;
  targetNumber: number;
  suffix: string;
  label: string;
  iconClass: string;
}

export interface CategoryItem {
  id: string;
  label: string;
  iconClass: string;
}

export interface MemoryItem {
  id: string;
  title: string;
  imageUrl: string;
  albumImages?: string[];
  author: {
    name: string;
    role: string;
    avatarUrl: string;
  };
  location: string;
  date: string;
  category: 'CSE' | 'english' | 'sports' | 'festivals' | 'rain' | 'architecture' | 'campus' | string;
  badgeLabel: string;
  badgeIcon: string;
  likesCount: number;
  aspectRatioClass: 'ratio-portrait-4-5' | 'ratio-landscape-16-9' | 'ratio-portrait-3-4';
  description?: string;
  tags?: string[];
}

export interface PhotographerItem {
  id: string;
  name: string;
  role: string;
  department: string;
  gradYear: string;
  avatarUrl: string;
  coverUrl: string;
  photosCount: number;
  totalLikes: number;
  bio: string;
  socials: {
    instagram?: string;
    portfolio?: string;
    twitter?: string;
  };
  featuredPhotos: string[];
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  day: string;
  month: string;
  year?: string;
  time: string;
  location: string;
  venueDetail?: string;
  imageUrl: string;
  category: string;
  categoryClass?: string;
  organizer: string;
  organizerLogo?: string;
  organizerRole?: string;
  description: string;
  highlights?: string[];
  audience: string;
  entryFee: string;
  registrationUrl?: string;
  registrationDeadline?: string;
  status: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// ============================================================================
// 1. SITE GENERAL CONFIGURATION
// ============================================================================

export const SITE_CONFIG: SiteConfig = {
  appName: 'MULens',
  archiveBadge: 'MU Media Archive',
  heroTitle: 'Where Moments Become',
  heroHighlight: 'Memories',
  heroSubtitle: 'Discover, share, and preserve the vibrant moments that define university life through the eyes of student photographers and storytellers.',
  searchPlaceholder: 'Search memories, locations, or photographers...',
  trendingTags: [
    { label: '#CSE Department', tag: 'CSE' },
    { label: '#EEE Department', tag: 'eee' },
    { label: '#Law Department', tag: 'law' },
    { label: '#BBA Department', tag: 'bba' },
    { label: '#English Department', tag: 'english' },
    { label: '#UniversityEvents', tag: 'university_events' }
  ]
};

// ============================================================================
// 2. HERO CROSSFADE SLIDER BACKGROUND IMAGES
// ============================================================================

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    imageUrl: 'https://i.imgur.com/My2mGop.jpeg',
    caption: 'Class of 26 Convocation'
  },
  {
    id: 'slide-2',
    imageUrl: 'https://i.imgur.com/Pn8EQuA.jpeg',
    caption: 'University Campus Quad'
  },
  {
    id: 'slide-3',
    imageUrl: 'https://i.imgur.com/a8twv95.jpeg',
    caption: 'Sunset Over Heritage Quad'
  },
  {
    id: 'slide-4',
    imageUrl: 'https://i.imgur.com/haVmm0b.jpeg',
    caption: 'Monsoon Walkway Reflections'
  }
];

// ============================================================================
// 3. STATISTICS COUNTERS
// ============================================================================

export const STATISTICS: StatItem[] = [
  {
    id: 'stat-photos',
    targetNumber: 0,
    suffix: '',
    label: 'Photos Archived',
    iconClass: 'bi-camera'
  },
  {
    id: 'stat-memories',
    targetNumber: 0,
    suffix: '',
    label: 'Memories Archived',
    iconClass: 'bi-archive'
  },
  {
    id: 'stat-events',
    targetNumber: 0,
    suffix: '',
    label: 'Upcoming Events',
    iconClass: 'bi-calendar3'
  },
  {
    id: 'stat-voices',
    targetNumber: 0,
    suffix: '',
    label: 'Campus Voices',
    iconClass: 'bi-chat-quote'
  }
];

// ============================================================================
// 4. GALLERY FILTER CATEGORIES
// ============================================================================

export const GALLERY_CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'All Memories', iconClass: 'bi-grid-fill' },
  { id: 'CSE', label: 'CSE Department', iconClass: 'bi-laptop' },
  { id: 'eee', label: 'EEE Department', iconClass: 'bi-cpu' },
  { id: 'law', label: 'Law Department', iconClass: 'bi-bank' },
  { id: 'bba', label: 'BBA Department', iconClass: 'bi-briefcase-fill' },
  { id: 'english', label: 'English Department', iconClass: 'bi-book-fill' },
  { id: 'university_events', label: 'University events', iconClass: 'bi-calendar-event' },
  { id: 'campus', label: 'Campus Life', iconClass: 'bi-camera-fill' }
];

// ============================================================================
// 5. FEATURED CAMPUS MEMORIES (PINTEREST / UNSPLASH MASONRY GALLERY)
// ============================================================================

export const FEATURED_MEMORIES: MemoryItem[] = [];

// ============================================================================
// 5.1 PHOTO OF THE WEEK SPOTLIGHT
// ============================================================================

export const PHOTO_OF_THE_WEEK = {
  title: 'Golden Hour Over Central Quadrangle',
  imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop',
  author: {
    name: "Elena Rostova '26",
    role: 'Senior Photojournalism Fellow',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
  },
  location: 'North Quad Plaza',
  date: 'Golden Hour',
  badgeLabel: 'Winner • Week 18',
  description: 'Captured during the final evening of Spring 2026 graduation week. The warm sunlight piercing through the gothic arches created a surreal moment of nostalgia, achievement, and quiet reflection.'
};

// ============================================================================
// 6. FEATURED STUDENT PHOTOGRAPHERS & CONTRIBUTORS
// ============================================================================

export const FEATURED_PHOTOGRAPHERS: PhotographerItem[] = [
  {
    id: 'photo-elena',
    name: 'Elena Rostova',
    role: 'Senior Photo Fellow',
    department: 'Visual Communications',
    gradYear: "'26",
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop',
    photosCount: 142,
    totalLikes: 8940,
    bio: 'Specializing in architectural geometry, graduation portraiture, and documentary student life storytelling.',
    socials: {
      instagram: 'https://instagram.com',
      portfolio: 'https://behance.net',
      twitter: 'https://twitter.com'
    },
    featuredPhotos: [
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=600&auto=format&fit=crop'
    ]
  },
  {
    id: 'photo-marcus',
    name: 'Marcus Vance',
    role: 'Sports Photojournalist',
    department: 'Journalism & Media Studies',
    gradYear: "'25",
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop',
    photosCount: 198,
    totalLikes: 12400,
    bio: 'Capturing high-speed sports action, court drama, and championship athletics across university leagues.',
    socials: {
      instagram: 'https://instagram.com',
      portfolio: 'https://vsco.co'
    },
    featuredPhotos: [
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop'
    ]
  },
  {
    id: 'photo-sarah',
    name: 'Sarah Chen',
    role: 'Cultural Reporter',
    department: 'Fine Arts & Music Studies',
    gradYear: "'27",
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
    photosCount: 115,
    totalLikes: 7820,
    bio: 'Documenting campus music festivals, nocturnal lights, theater performances, and vibrant student arts.',
    socials: {
      instagram: 'https://instagram.com',
      portfolio: 'https://unsplash.com'
    },
    featuredPhotos: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop'
    ]
  }
];

// ============================================================================
// 7. UPCOMING CAMPUS EVENTS
// ============================================================================

export const UPCOMING_EVENTS: EventItem[] = [
  {
    id: 'evt-alpha-concert',
    title: 'Alpha Beats: Campus Spring Music Concert 2026',
    date: 'MAY 15, 2026',
    day: '15',
    month: 'MAY',
    year: '2026',
    time: '5:30 PM - 10:00 PM',
    location: 'Central Auditorium & Open Lawns',
    venueDetail: 'Main Stage & Open Amphitheater',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
    category: 'Music Concert',
    categoryClass: 'bg-primary-subtle text-primary border-primary-subtle',
    organizer: 'Alpha Community & Music Club',
    organizerLogo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=150&auto=format&fit=crop',
    organizerRole: 'Campus Music & Culture Guild',
    description: 'An electrifying evening of live acoustic sets, indie-rock university bands, guest vocalists, and an immersive sound & light experience under the stars.',
    highlights: [
      'Performances by 6 top university bands and guest indie headliners',
      'Free admission with student ID badge verification at gate',
      'Food truck alley and acoustic jam lounge'
    ],
    audience: 'All Students, Faculty & University Guests',
    entryFee: 'Free Entry (Student ID Required)',
    registrationUrl: 'https://forms.google.com',
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

// ============================================================================
// 8. FREQUENTLY ASKED QUESTIONS (FAQ)
// ============================================================================

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How can I submit my photos to MULens?',
    answer: 'Any enrolled student, faculty member, or alumnus can submit high-resolution photographs through the "Submit Memories" modal in the top navigation or footer form. Submissions undergo a light editorial review for quality and privacy compliance.'
  },
  {
    id: 'faq-2',
    question: 'Are images available for download and editorial use?',
    answer: 'Yes! High-resolution images are freely accessible for university publications, student projects, and personal archives under the MULens Campus Creative Commons License.'
  },
  {
    id: 'faq-3',
    question: 'How do I join the official photography press crew?',
    answer: 'We recruit student photojournalists at the beginning of each semester. Apply through the "Join Crew" section in the application to gain press badges, equipment grants, and access to exclusive campus events.'
  }
];
