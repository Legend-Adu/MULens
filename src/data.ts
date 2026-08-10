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
