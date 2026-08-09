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
  time: string;
  location: string;
  imageUrl: string;
  category: string;
  description: string;
  organizer: string;
  attendeesCount: number;
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
    imageUrl: 'https://i.imgur.com/Ic8TgWx.jpeg',
    caption: 'Class of 26 Convocation'
  },
  {
    id: 'slide-2',
    imageUrl: 'https://i.imgur.com/Kb8tL9u.jpeg',
    caption: 'University Campus Quad'
  },
  {
    id: 'slide-3',
    imageUrl: 'https://i.imgur.com/WmQkrbx.jpeg',
    caption: 'Sunset Over Heritage Quad'
  },
  {
    id: 'slide-4',
    imageUrl: 'https://i.imgur.com/CoOzPIM.jpeg',
    caption: 'Monsoon Walkway Reflections'
  }
];

// ============================================================================
// 3. STATISTICS COUNTERS
// ============================================================================

export const STATISTICS: StatItem[] = [
  {
    id: 'stat-photos',
    targetNumber: 48500,
    suffix: '+',
    label: 'Campus Photos',
    iconClass: 'bi-camera'
  },
  {
    id: 'stat-videos',
    targetNumber: 1200,
    suffix: '+',
    label: 'Video Stories',
    iconClass: 'bi-play-btn'
  },
  {
    id: 'stat-events',
    targetNumber: 350,
    suffix: '+',
    label: 'Events Covered',
    iconClass: 'bi-calendar2-check'
  },
  {
    id: 'stat-contributors',
    targetNumber: 850,
    suffix: '+',
    label: 'Contributors',
    iconClass: 'bi-people'
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

export const FEATURED_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-cse-1',
    title: 'CSE Annual Hackathon & Innovation Expo 2026',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
    albumImages: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop'
    ],
    author: {
      name: "Alex Rivera '27",
      role: "CSE Society Lead",
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop'
    },
    location: 'CSE Central Lab & Auditorium',
    date: 'May 18, 2026',
    category: 'CSE',
    badgeLabel: 'CSE Department',
    badgeIcon: 'bi-laptop',
    likesCount: 589,
    aspectRatioClass: 'ratio-portrait-4-5',
    description: '36 hours of non-stop algorithmic problem solving, AI app building, and project demos at the annual CSE Dept Hackathon.',
    tags: ['CSE', 'Hackathon', 'Coding', 'AI', 'Expo']
  },
  {
    id: 'mem-1',
    title: "Class of '26 Convocation Triumph",
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop',
    albumImages: [
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop'
    ],
    author: {
      name: "Elena Rostova '26",
      role: "Senior Photo Fellow",
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
    },
    location: 'Grand Quad',
    date: 'May 12, 2026',
    category: 'english',
    badgeLabel: 'English Department',
    badgeIcon: 'bi-book-fill',
    likesCount: 342,
    aspectRatioClass: 'ratio-portrait-4-5',
    description: 'Caps thrown high into the sunlit sky above the Grand Quadrangle as 1,200 graduates celebrate academic completion.',
    tags: ['English', 'Literature', 'Quad', 'ClassOf2026']
  },
  {
    id: 'mem-law-1',
    title: 'Moots & Mock Trial Championship Finals',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1200&auto=format&fit=crop',
    albumImages: [
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=1200&auto=format&fit=crop'
    ],
    author: {
      name: "Tariq Rahman '26",
      role: "Law Society Editor",
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
    },
    location: 'Law Moot Court',
    date: 'May 02, 2026',
    category: 'law',
    badgeLabel: 'Law Department',
    badgeIcon: 'bi-bank',
    likesCount: 412,
    aspectRatioClass: 'ratio-landscape-16-9',
    description: 'Law scholars presenting closing arguments during the annual inter-university mock trial championship.',
    tags: ['LawDepartment', 'MootCourt', 'Law', 'Championship']
  },
  {
    id: 'mem-3',
    title: 'Spring Symphony Under The Stars',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
    author: {
      name: "Sarah Chen '27",
      role: "Cultural Reporter",
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop'
    },
    location: 'Amphitheatre',
    date: 'Apr 15, 2026',
    category: 'university_events',
    badgeLabel: 'University events',
    badgeIcon: 'bi-calendar-event',
    likesCount: 621,
    aspectRatioClass: 'ratio-portrait-3-4',
    description: 'An enchanting open-air night concert performed by the university orchestra in front of 3,000 students.',
    tags: ['UniversityEvents', 'Music', 'Concert', 'Symphony']
  },
  {
    id: 'mem-eee-1',
    title: 'Hardware Circuit & Robotics Showcase',
    imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=1200&auto=format&fit=crop',
    albumImages: [
      'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1200&auto=format&fit=crop'
    ],
    author: {
      name: "Samiul Hoque '25",
      role: "IEEE Student Lead",
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop'
    },
    location: 'EEE Innovation Lab',
    date: 'Apr 08, 2026',
    category: 'eee',
    badgeLabel: 'EEE Department',
    badgeIcon: 'bi-cpu',
    likesCount: 528,
    aspectRatioClass: 'ratio-portrait-4-5',
    description: 'EEE researchers testing custom microcontroller circuit boards and autonomous drone hardware prototypes.',
    tags: ['EEE', 'Robotics', 'Circuits', 'Engineering']
  },
  {
    id: 'mem-bba-1',
    title: 'Annual Venture Pitch & Business Summit',
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1200&auto=format&fit=crop',
    albumImages: [
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1200&auto=format&fit=crop'
    ],
    author: {
      name: "Tanzim Rahat '27",
      role: "BBA Club President",
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
    },
    location: 'BBA Auditorium',
    date: 'Mar 25, 2026',
    category: 'bba',
    badgeLabel: 'BBA Department',
    badgeIcon: 'bi-briefcase-fill',
    likesCount: 465,
    aspectRatioClass: 'ratio-landscape-16-9',
    description: 'BBA student teams pitching startup concepts and brand marketing strategies to venture capital mentors.',
    tags: ['BBA', 'Business', 'Startup', 'Summit']
  },
  {
    id: 'mem-6',
    title: 'Student Hub Group Study & Laughter',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop',
    author: {
      name: "Sarah Chen '27",
      role: "Cultural Reporter",
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop'
    },
    location: 'Student Plaza',
    date: 'Mar 05, 2026',
    category: 'campus',
    badgeLabel: 'Campus Life',
    badgeIcon: 'bi-people-fill',
    likesCount: 390,
    aspectRatioClass: 'ratio-portrait-3-4',
    description: 'Students collaborating over group projects and coffee on the sunlit steps of the Student Union.',
    tags: ['StudentLife', 'Friends', 'Study', 'Campus']
  },
  {
    id: 'mem-7',
    title: 'Golden Hour Reflection over Quad Lawn',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop',
    author: {
      name: "Alex Rivera '27",
      role: "Documentary Lead",
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop'
    },
    location: 'North Quad',
    date: 'Feb 24, 2026',
    category: 'campus',
    badgeLabel: 'Golden Hour',
    badgeIcon: 'bi-sundial-fill',
    likesCount: 712,
    aspectRatioClass: 'ratio-portrait-4-5',
    description: 'Golden hour sunset rays casting long shadows across the historic central university quadrangle.',
    tags: ['Sunset', 'GoldenHour', 'Quad', 'Landscape']
  },
  {
    id: 'mem-8',
    title: 'Annual Cultural Night Concert Light Show',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
    author: {
      name: "Sarah Chen '27",
      role: "Cultural Reporter",
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop'
    },
    location: 'Auditorium',
    date: 'Feb 10, 2026',
    category: 'university_events',
    badgeLabel: 'University events',
    badgeIcon: 'bi-calendar-event',
    likesCount: 830,
    aspectRatioClass: 'ratio-landscape-16-9',
    description: 'Vibrant laser lights and stage lasers creating a dazzling visual spectacle at the Annual Cultural Fest.',
    tags: ['CulturalFest', 'Concert', 'Lights', 'Night']
  }
];

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
    id: 'evt-1',
    title: 'Spring Photojournalism Exhibition 2026',
    date: 'MAY 18, 2026',
    time: '4:00 PM - 8:00 PM',
    location: 'Heritage Art Gallery',
    imageUrl: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=800&auto=format&fit=crop',
    category: 'Exhibition',
    description: 'An curated physical gallery featuring over 150 prints by student photojournalists documenting campus evolution.',
    organizer: 'MULens Editorial Board',
    attendeesCount: 240
  },
  {
    id: 'evt-2',
    title: 'Annual Varsity Championship Finals',
    date: 'MAY 24, 2026',
    time: '2:00 PM - 6:00 PM',
    location: 'University Main Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop',
    category: 'Sports',
    description: 'The ultimate rivalry match of the season with live media coverage, sideline press accreditation, and drone photography.',
    organizer: 'Varsity Athletics Association',
    attendeesCount: 1850
  },
  {
    id: 'evt-3',
    title: 'Monsoon Sunset Photography Walk',
    date: 'JUN 05, 2026',
    time: '5:30 PM - 7:30 PM',
    location: 'North Quad Fountain',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop',
    category: 'Workshop',
    description: 'Join senior fellows for an interactive golden hour photowalk focusing on rain reflections, long exposure, and framing.',
    organizer: 'Photography Society',
    attendeesCount: 85
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
