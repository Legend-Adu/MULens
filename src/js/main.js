/**
 * MULens - Core Interactive Application & Auth System
 * Frontend Simulated Authentication with LocalStorage
 */

import * as MULensData from '../data.ts';
import { imageStoreDB } from './idb.js';
import {
  initSupabase,
  fetchMemoriesFromSupabase,
  fetchPOTWFromSupabase,
  setPOTWOnServer,
  fetchEventsFromSupabase,
  manageEventOnServer,
  fetchCampusVoices,
  fetchAllCampusVoices,
  submitCampusVoice,
  manageVoiceOnServer,
  saveMemoryToSupabase,
  updateMemoryStatusInSupabase,
  deleteMemoryFromSupabase,
  uploadMediaToSupabase,
  migrateIndexedDBToSupabase,
  cachedCloudMemories,
  isSupabaseConnected
} from './supabase.js';

// Central helper to retrieve all combined memories from Supabase Cloud + IndexedDB + Base Data
function getAllMemoriesCombined() {
  const cloudMemories = cachedCloudMemories || [];
  const customMemories = imageStoreDB.cachedMemories || [];
  const deletedMemoryIds = JSON.parse(localStorage.getItem('campuslens_deleted_memories') || '[]');
  const modifiedMemoriesMap = JSON.parse(localStorage.getItem('campuslens_modified_memories') || '{}');

  let baseMemories = (MULensData && Array.isArray(MULensData.FEATURED_MEMORIES)) ? MULensData.FEATURED_MEMORIES : [];
  baseMemories = baseMemories.map(bm => {
    if (modifiedMemoriesMap[bm.id]) {
      return { ...bm, ...modifiedMemoriesMap[bm.id] };
    }
    return bm;
  });

  let combined = [...cloudMemories];

  // Merge IndexedDB memories if not already in cloudMemories
  customMemories.forEach(cm => {
    if (!combined.some(m => String(m.id) === String(cm.id))) {
      combined.push(cm);
    }
  });

  // Merge base sample memories if not already in combined
  baseMemories.forEach(bm => {
    if (!combined.some(m => String(m.id) === String(bm.id))) {
      combined.push(bm);
    }
  });

  // Exclude deleted memory IDs
  return combined.filter(m => !deletedMemoryIds.includes(m.id) && !deletedMemoryIds.includes(String(m.id)));
}

// Helper to format/normalize image URLs
function normalizeImgUrl(url) {
  if (!url) return '';

  let formatted = String(url).trim();

  // Handle Markdown links:
  // [https://example.com/image.jpg](https://example.com/image.jpg)
  const markdownMatch = formatted.match(/^\[.*?\]\((https?:\/\/[^)]+)\)$/);
  if (markdownMatch) {
    formatted = markdownMatch[1];
  }

  // Handle Imgur page URLs and convert them to direct image URLs
  if (
    formatted.includes('imgur.com/') &&
    !formatted.includes('i.imgur.com/')
  ) {
    const id = formatted
      .split('imgur.com/')[1]
      .split('/')[0]
      .split('?')[0]
      .split('#')[0];

    if (id && !id.includes('.')) {
      formatted = `https://i.imgur.com/${id}.jpeg`;
    }
  }

  return formatted;
}
// Expose central data store globally so manually editing /src/data.ts updates the application
if (typeof window !== 'undefined') {
  window.MULENS_DATA = MULensData;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize IndexedDB storage engine for media files & custom memories
  await imageStoreDB.init();

  // Initialize Supabase Cloud Storage & Database connection
  await initSupabase();
  await fetchMemoriesFromSupabase();
  try {
    const potw = await fetchPOTWFromSupabase();
    window.__POTW_GLOBAL = potw || null;
  } catch (e) {
    window.__POTW_GLOBAL = null;
  }
  try {
    const events = await fetchEventsFromSupabase();
    window.__EVENTS_GLOBAL = Array.isArray(events) ? events : [];
  } catch (e) {
    window.__EVENTS_GLOBAL = [];
  }
  try {
    const voicesData = await fetchAllCampusVoices();
    window.__VOICES_GLOBAL = voicesData || { voices: [], featuredVoiceId: null };
  } catch (e) {
    window.__VOICES_GLOBAL = { voices: [], featuredVoiceId: null };
  }
  // --------------------------------------------------------------------------
  // 1. Initial Data Setup (LocalStorage)
  // --------------------------------------------------------------------------
  const defaultUsers = [
    {
      id: 'usr_admin',
      name: 'Shariar Adnan (Admin)',
      email: 'shariaradnan88@gmail.com',
      password: 'adminpassword123',
      dept: 'University Media Director',
      role: 'Administrator',
      isAdmin: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
      bio: 'Lead System Administrator & Director of MULens Media Archive.',
      gear: 'Master Admin Access'
    },
    {
      id: 'usr_alex',
      name: 'Alex Rivera',
      email: 'alex.rivera@university.edu',
      password: 'password123',
      dept: "Media Arts '27",
      role: 'Student Photographer',
      isAdmin: false,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&auto=format&fit=crop',
      bio: 'Passionate about capturing high-energy campus sports, homecoming celebrations, and golden hour architecture at the Central Quad.',
      gear: 'Sony A7 IV RAW, 35mm f/1.4 GM, 85mm f/1.8 Prime'
    },
    {
      id: 'usr_elena',
      name: 'Elena Rostova',
      email: 'elena.rostova@university.edu',
      password: 'password123',
      dept: "Photojournalism '26",
      role: 'Senior Editorial Fellow',
      isAdmin: false,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
      bio: 'Senior Photojournalism Fellow documenting university traditions, convocation highlights, and student culture.',
      gear: 'Canon EOS R5, 24-70mm f/2.8 L Series'
    },
    {
      id: 'usr_fahmid',
      name: 'Fahmid Samin',
      email: 'fahim.rahman@demo.mulens.local',
      password: 'Demo@1234',
      dept: 'CSE',
      role: 'Student',
      isAdmin: false,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
      bio: 'CSE student and passionate campus tech & photography contributor.',
      gear: 'Canon EOS 90D, 18-135mm Lens'
    },
    {
      id: 'usr_masrura',
      name: 'Masrura Chowdhury',
      email: 'nusrat.jahan@demo.mulens.local',
      password: 'Demo@1234',
      dept: 'EEE',
      role: 'Student',
      isAdmin: false,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
      bio: 'EEE student documenting campus robotics, hardware expos, and laboratory life.',
      gear: 'Sony A6400, 50mm f/1.8 Prime'
    },
    {
      id: 'usr_tahsin',
      name: 'Tahsin Ahmed',
      email: 'tahsin.ahmed@demo.mulens.local',
      password: 'Demo@1234',
      dept: 'BBA',
      role: 'Student',
      isAdmin: false,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
      bio: 'BBA student capturing business summits, startup pitches, and campus culture.',
      gear: 'Nikon Z50, 16-50mm'
    },
    {
      id: 'usr_sagor',
      name: 'Sagor Chowdhury',
      email: 'mehedi.hasan@demo.mulens.local',
      password: 'Demo@1234',
      dept: 'English',
      role: 'Student',
      isAdmin: false,
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop',
      bio: 'English Literature student with a passion for candid campus storytelling and cultural festivals.',
      gear: 'Fujifilm X-T30, 23mm f/2'
    }
  ];

  let storedUsersList = JSON.parse(localStorage.getItem('campuslens_users') || 'null');
  if (!storedUsersList) {
    localStorage.setItem('campuslens_users', JSON.stringify(defaultUsers));
  } else {
    let updated = false;
    defaultUsers.forEach(du => {
      if (!storedUsersList.some(u => (u.email && u.email.toLowerCase() === du.email.toLowerCase()) || u.id === du.id)) {
        storedUsersList.push(du);
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem('campuslens_users', JSON.stringify(storedUsersList));
    }
  }

  // Ensure default active user is set to Admin (Shariar Adnan) if not logged in
  if (!localStorage.getItem('campuslens_user')) {
    localStorage.setItem('campuslens_user', JSON.stringify(defaultUsers[0]));
  }

  // Sample initial favorites for Alex Rivera if not set
  if (!localStorage.getItem('campuslens_favorites_usr_alex')) {
    const sampleFavs = [
      {
        id: 'fav_1',
        title: 'Golden Hour Over Central Quadrangle',
        img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop',
        author: 'Elena Rostova',
        location: 'North Quad Plaza',
        date: 'Spring 2026',
        tag: 'Spotlight'
      },
      {
        id: 'fav_2',
        title: 'Varsity Soccer Championship',
        img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop',
        author: 'Alex Rivera',
        location: 'Main Stadium',
        date: 'May 2026',
        tag: 'Sports'
      }
    ];
    localStorage.setItem('campuslens_favorites_usr_alex', JSON.stringify(sampleFavs));
  }

  // Sample initial albums for Alex Rivera if not set
  if (!localStorage.getItem('campuslens_albums_usr_alex')) {
    const sampleAlbums = [
      {
        id: 'alb_1',
        title: 'Spring Convocation Procession',
        category: 'Graduation',
        imgUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop',
        location: 'Gothic Auditorium Lawn',
        date: 'May 12, 2026'
      },
      {
        id: 'alb_2',
        title: 'Monsoon Evening Rain at Heritage Steps',
        category: 'Campus Life',
        imgUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=800&auto=format&fit=crop',
        location: 'Heritage Arch Lawn',
        date: 'April 28, 2026'
      }
    ];
    localStorage.setItem('campuslens_albums_usr_alex', JSON.stringify(sampleAlbums));
  }

  // Helper functions for state
  const getUsers = () => JSON.parse(localStorage.getItem('campuslens_users') || '[]');
  const getCurrentUser = () => JSON.parse(localStorage.getItem('campuslens_user') || 'null');

  const isAdminUser = (user) => {
    if (!user) return false;
    if (user.isAdmin === true) return true;
    const email = (user.email || '').toLowerCase();
    const role = (user.role || '').toLowerCase();
    return email === 'shariaradnan88@gmail.com' || email.includes('admin') || role.includes('admin');
  };

  const canDeleteMemory = (mem) => {
    if (!mem) return false;
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    // Admin user can delete ANY memory
    if (isAdminUser(currentUser) || currentUser.isAdmin === true) return true;

    const currentName = (currentUser.name || '').toLowerCase();
    const currentId = String(currentUser.id || '');

    // Extract author & owner details safely
    const authorName = (mem.author && typeof mem.author === 'object' ? mem.author.name : (mem.author || '')).toLowerCase();
    const memOwnerId = String(mem.ownerId || mem.userId || mem.createdBy || (mem.author && mem.author.id) || '');

    if (currentId && memOwnerId && currentId === memOwnerId) return true;
    if (currentName && authorName && currentName === authorName) return true;

    // Check custom memory ownership
    if (mem.id && String(mem.id).startsWith('mem_custom_')) {
      if ((authorName && currentName && authorName === currentName) || (memOwnerId && currentId && memOwnerId === currentId)) {
        return true;
      }
    }

    return false;
  };

  const getUserUploads = (userOrUserId) => {
    let user = null;
    if (typeof userOrUserId === 'object' && userOrUserId !== null) {
      user = userOrUserId;
    } else if (typeof userOrUserId === 'string' && userOrUserId) {
      const users = getUsers();
      user = users.find(u => u.id === userOrUserId) || { id: userOrUserId, name: '' };
    }
    if (!user) return [];

    const userIdStr = String(user.id || '');
    const userNameLower = (user.name || '').toLowerCase();

    const allMemories = getAllMemoriesCombined();

    // Return memories uploaded by this user
    return allMemories.filter(m => {
      const memOwnerId = String(m.ownerId || m.userId || m.createdBy || (m.author && m.author.id) || '');
      const authorName = (m.author && typeof m.author === 'object' ? m.author.name : (m.author || '')).toLowerCase();

      if (userIdStr && memOwnerId && userIdStr === memOwnerId) return true;
      if (userNameLower && authorName && userNameLower === authorName) return true;

      // Check legacy userAlbums stored in localStorage
      const legacyAlbums = getUserAlbums(user.id);
      if (legacyAlbums.some(alb => String(alb.id) === String(m.id))) return true;

      return false;
    });
  };

  function getStatusBadgeHtml(status) {
    const st = status || 'approved';
    if (st === 'pending') {
      return `<span class="badge bg-warning text-dark border border-warning-subtle shadow-sm extra-small fw-bold"><i class="bi bi-clock-history me-1"></i>🟡 Pending Review</span>`;
    } else if (st === 'approved') {
      return `<span class="badge bg-success text-white border border-success-subtle shadow-sm extra-small fw-bold"><i class="bi bi-check-circle-fill me-1"></i>🟢 Published</span>`;
    } else if (st === 'rejected') {
      return `<span class="badge bg-danger text-white border border-danger-subtle shadow-sm extra-small fw-bold"><i class="bi bi-x-circle-fill me-1"></i>🔴 Rejected</span>`;
    }
    return '';
  }

  async function approveMemorySubmission(memId) {
    const memIdStr = String(memId);
    const currentUser = getCurrentUser();
    const approvedBy = currentUser ? (currentUser.name || currentUser.id) : 'Admin';

    // 1. Update status in Supabase Database
    await updateMemoryStatusInSupabase(memIdStr, 'approved', approvedBy);

    // 2. Update status in IndexedDB
    const customMemories = imageStoreDB.cachedMemories || [];
    const targetMem = customMemories.find(m => String(m.id) === memIdStr);
    
    if (targetMem) {
      targetMem.status = 'approved';
      targetMem.approvedAt = Date.now();
      targetMem.approvedBy = approvedBy;
      await imageStoreDB.saveMemory(targetMem);
    } else {
      const modifiedMap = JSON.parse(localStorage.getItem('campuslens_modified_memories') || '{}');
      if (modifiedMap[memIdStr]) {
        modifiedMap[memIdStr].status = 'approved';
        modifiedMap[memIdStr].approvedAt = Date.now();
        localStorage.setItem('campuslens_modified_memories', JSON.stringify(modifiedMap));
      }
    }

    showToast('🟢 Submission approved and published globally to Supabase!', 'success');

    await fetchMemoriesFromSupabase();
    await imageStoreDB.reloadMemoryCache();
    renderDynamicDataFromDataTS();
    renderAdminSpaceView();
    renderProfileView();
    renderProfileTabs();
  }

  async function rejectMemorySubmission(memId) {
    const memIdStr = String(memId);

    // 1. Update status in Supabase Database
    await updateMemoryStatusInSupabase(memIdStr, 'rejected');

    // 2. Update status in IndexedDB
    const customMemories = imageStoreDB.cachedMemories || [];
    const targetMem = customMemories.find(m => String(m.id) === memIdStr);

    if (targetMem) {
      targetMem.status = 'rejected';
      await imageStoreDB.saveMemory(targetMem);
    } else {
      const modifiedMap = JSON.parse(localStorage.getItem('campuslens_modified_memories') || '{}');
      if (modifiedMap[memIdStr]) {
        modifiedMap[memIdStr].status = 'rejected';
        localStorage.setItem('campuslens_modified_memories', JSON.stringify(modifiedMap));
      }
    }

    showToast('🔴 Submission rejected.', 'danger');

    await fetchMemoriesFromSupabase();
    await imageStoreDB.reloadMemoryCache();
    renderDynamicDataFromDataTS();
    renderAdminSpaceView();
    renderProfileView();
    renderProfileTabs();
  }

  const setCurrentUser = (user) => {
    if (user) {
      localStorage.setItem('campuslens_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('campuslens_user');
    }
    renderAuthState();
  };

  const getUserFavorites = (userId) => {
    if (!userId) return [];
    return JSON.parse(localStorage.getItem(`campuslens_favorites_${userId}`) || '[]');
  };

  const setUserFavorites = (userId, favs) => {
    localStorage.setItem(`campuslens_favorites_${userId}`, JSON.stringify(favs));
    renderProfileTabs();
  };

  const getUserAlbums = (userId) => {
    if (!userId) return [];
    return JSON.parse(localStorage.getItem(`campuslens_albums_${userId}`) || '[]');
  };

  const setUserAlbums = (userId, albums) => {
    localStorage.setItem(`campuslens_albums_${userId}`, JSON.stringify(albums));
    renderProfileTabs();
  };

  // --------------------------------------------------------------------------
  // 2. Initialize AOS & General Utilities
  // --------------------------------------------------------------------------
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 80
    });
  }

  // --------------------------------------------------------------------------
  // Camera Lens Cinematic Opening Animation Engine & Scroll Reveal System
  // --------------------------------------------------------------------------
  function initIntroAnimation() {
    const introOverlay = document.getElementById('intro-screen');
    const skipBtn = document.getElementById('skip-intro-btn');
    if (!introOverlay) {
      initScrollReveal();
      return;
    }

    // Failsafe: Ensure homepage displays normally if reduced motion or already played
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasSeenIntro = sessionStorage.getItem('campuslens_intro_played');

    if (prefersReducedMotion || hasSeenIntro) {
      introOverlay.remove();
      document.body.classList.remove('intro-active');
      initScrollReveal();
      return;
    }

    // Set intro state on body for blur effects
    document.body.classList.add('intro-active');
    sessionStorage.setItem('campuslens_intro_played', 'true');

    // DOM Elements
    const brandingContainer = document.getElementById('intro-branding-container');
    const lensWrapper = document.getElementById('camera-lens-wrapper');
    const reticle = document.getElementById('lens-focus-reticle');
    const greenLockBadge = document.getElementById('reticle-green-lock-badge');
    const shutterContainer = document.getElementById('aperture-shutter');
    const flashOverlay = document.getElementById('intro-flash-overlay');

    let isTerminated = false;

    // Synthesize camera shutter acoustic feedback via Web Audio API
    function playShutterSound() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1400;
        filter.Q.value = 3;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
      } catch (e) {
        // Fallback gracefully
      }
    }

    // Terminate intro sequence and reveal homepage smoothly
    function finishAndRevealHomepage() {
      if (isTerminated) return;
      isTerminated = true;

      // Remove blur and body locks
      document.body.classList.remove('intro-active');
      introOverlay.classList.add('fade-out');
      document.body.classList.add('intro-revealing');

      setTimeout(() => {
        if (introOverlay) introOverlay.remove();
        document.body.classList.remove('intro-revealing');
        initScrollReveal();
      }, 750);
    }

    // Failsafe timer (3.5s max guard so website is never blocked)
    const failsafeTimeout = setTimeout(() => {
      finishAndRevealHomepage();
    }, 3500);

    // Skip button click handler
    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearTimeout(failsafeTimeout);
        finishAndRevealHomepage();
      });
    }

    try {
      // 1. Black screen -> 2. Slowly fade in CampusLens logo & "Every Memory Has A Story" (100ms)
      setTimeout(() => {
        if (isTerminated) return;
        if (brandingContainer) brandingContainer.classList.add('fade-in-logo');
      }, 100);

      // 4. After 1 second, logo gently fades upward (1000ms)
      setTimeout(() => {
        if (isTerminated) return;
        if (brandingContainer) brandingContainer.classList.add('fade-up-logo');
      }, 1000);

      // 5. Camera focus frame appears in center, background remains blurred (1050ms)
      setTimeout(() => {
        if (isTerminated) return;
        if (lensWrapper) lensWrapper.classList.add('frame-visible');
      }, 1050);

      // 6. Focus frame searches for focus using smooth scaling animations (1350ms)
      setTimeout(() => {
        if (isTerminated) return;
        if (lensWrapper) lensWrapper.classList.add('lens-focusing');
      }, 1350);

      // 7. Green focus indicator appears (1700ms)
      setTimeout(() => {
        if (isTerminated) return;
        if (reticle) reticle.classList.add('active-lock');
        if (greenLockBadge) greenLockBadge.classList.add('active');
      }, 1700);

      // 8. Soft camera flash fills screen & shutter sound (1980ms)
      setTimeout(() => {
        if (isTerminated) return;
        if (flashOverlay) flashOverlay.classList.add('flash-active');
        if (shutterContainer) shutterContainer.classList.add('shutter-closing');
        playShutterSound();
      }, 1980);

      // 9. Blur disappears, flash fades (2120ms)
      setTimeout(() => {
        if (isTerminated) return;
        document.body.classList.remove('intro-active');
        if (flashOverlay) flashOverlay.classList.remove('flash-active');
        if (shutterContainer) {
          shutterContainer.classList.remove('shutter-closing');
          shutterContainer.classList.add('shutter-opening');
        }
      }, 2120);

      // 10. Homepage fades in from center (2400ms - 2500ms duration)
      setTimeout(() => {
        if (isTerminated) return;
        clearTimeout(failsafeTimeout);
        finishAndRevealHomepage();
      }, 2450);

    } catch (err) {
      console.warn("Intro animation error fallback:", err);
      finishAndRevealHomepage();
    }
  }

  // --------------------------------------------------------------------------
  // 11. Staggered Scroll Animations for Every Homepage Section
  // --------------------------------------------------------------------------
  function initScrollReveal() {
    const revealElements = document.querySelectorAll(
      '#page-home section, #page-home .memory-card, #page-home .event-card, #page-home .testimonial-card'
    );

    if (!revealElements.length) return;

    revealElements.forEach((el, index) => {
      if (!el.classList.contains('reveal-on-scroll')) {
        el.classList.add('reveal-on-scroll');
        const delay = (index % 4) * 0.12;
        el.style.transitionDelay = `${delay}s`;
      }
    });

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.12
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // Initialize intro animation
  initIntroAnimation();

  // Scroll Progress & Navbar Scrolled State
  const scrollProgress = document.getElementById('scroll-progress');
  const navbar = document.querySelector('.navbar-custom');
  const backToTopBtn = document.getElementById('back-to-top');

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (scrollProgress) scrollProgress.style.width = `${scrollPercent}%`;

    if (navbar) {
      if (scrollTop > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    if (backToTopBtn) {
      if (scrollTop > 300) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    }
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Dark Mode Toggle (Desktop & Mobile)
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeToggleMobileBtn = document.getElementById('theme-toggle-mobile');
  const htmlElement = document.documentElement;
  const savedTheme = localStorage.getItem('campuslens-theme') || 'light';
  htmlElement.setAttribute('data-bs-theme', savedTheme);
  updateThemeIcon(savedTheme);

  function toggleTheme() {
    const currentTheme = htmlElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('campuslens-theme', newTheme);
    updateThemeIcon(newTheme);
    showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
  }

  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
  if (themeToggleMobileBtn) themeToggleMobileBtn.addEventListener('click', toggleTheme);

  function updateThemeIcon(theme) {
    const toggleBtns = document.querySelectorAll('#theme-toggle, #theme-toggle-mobile');
    toggleBtns.forEach(btn => {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = theme === 'dark' ? 'bi bi-sun-fill text-warning' : 'bi bi-moon-stars-fill';
      }
    });
  }

  // Floating Navbar Scrollspy for Active Section Glow
  function updateActiveNavLink() {
    const homePage = document.getElementById('page-home');
    if (!homePage || homePage.classList.contains('d-none')) {
      return;
    }
    const navSections = document.querySelectorAll('#page-home section[id]');
    if (!navSections.length) return;
    let currentSection = 'hero';
    const scrollPosition = window.scrollY + 220;

    navSections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentSection = section.getAttribute('id');
      }
    });

    const allNavLinks = document.querySelectorAll('.navbar-custom .nav-link, #offcanvasNavbar .nav-link');
    allNavLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${currentSection}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNavLink);

  // Toast Function
  function showToast(message, type = 'primary') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0 shadow-lg mb-2`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');

    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi bi-info-circle-fill fs-5"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    toastContainer.appendChild(toastEl);

    if (typeof bootstrap !== 'undefined') {
      const bsToast = new bootstrap.Toast(toastEl, { delay: 3500 });
      bsToast.show();
      toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    }
  }

  // --------------------------------------------------------------------------
  // 3. Dynamic Authentication State Rendering
  // --------------------------------------------------------------------------
  const navAuthContainer = document.getElementById('nav-auth-buttons');
  const mobileAuthContainer = document.getElementById('mobile-auth-container');

  function renderAuthState() {
    const currentUser = getCurrentUser();
    const isUserAdmin = isAdminUser(currentUser);

    const navAdminLink = document.getElementById('nav-admin-link');
    const mobileAdminLink = document.getElementById('mobile-admin-link');
    if (navAdminLink) {
      if (isUserAdmin) navAdminLink.classList.remove('d-none');
      else navAdminLink.classList.add('d-none');
    }
    if (mobileAdminLink) {
      if (isUserAdmin) mobileAdminLink.classList.remove('d-none');
      else mobileAdminLink.classList.add('d-none');
    }

    document.querySelectorAll('.upload-approval-notice').forEach(el => {
      if (isUserAdmin) {
        el.classList.add('d-none');
      } else {
        el.classList.remove('d-none');
      }
    });

    if (!navAuthContainer) return;

    if (currentUser) {
      // Logged in UI for Desktop Navbar
      navAuthContainer.innerHTML = `
        <div class="dropdown">
          <button class="nav-user-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="${currentUser.avatar}" alt="${currentUser.name}" class="nav-user-avatar">
            <span class="d-none d-md-inline text-truncate" style="max-width: 120px;">${currentUser.name.split(' ')[0]}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end user-dropdown-menu">
            <li class="user-dropdown-header">
              <div class="fw-bold text-truncate">${currentUser.name}</div>
              <div class="text-muted extra-small text-truncate">${currentUser.email}</div>
            </li>
            <li>
              <button class="dropdown-item-custom profile-trigger" data-tab="overview">
                <i class="bi bi-person-circle text-primary"></i> My Profile
              </button>
            </li>
            <li>
              <button class="dropdown-item-custom profile-trigger" data-tab="favorites">
                <i class="bi bi-heart-fill text-danger"></i> Favorites
              </button>
            </li>
            <li>
              <button class="dropdown-item-custom profile-trigger" data-tab="albums">
                <i class="bi bi-images text-info"></i> My Albums
              </button>
            </li>
            <li>
              <button class="dropdown-item-custom profile-trigger" data-tab="settings">
                <i class="bi bi-gear-fill text-secondary"></i> Settings
              </button>
            </li>
            ${isUserAdmin ? `
            <li>
              <a href="#admin" class="dropdown-item-custom text-warning fw-bold">
                <i class="bi bi-shield-lock-fill text-warning"></i> Admin Panel
              </a>
            </li>
            ` : ''}
            <li><hr class="dropdown-divider my-1"></li>
            <li>
              <button class="dropdown-item-custom text-danger" id="logout-btn">
                <i class="bi bi-box-arrow-right"></i> Logout
              </button>
            </li>
          </ul>
        </div>
      `;

      // Logged in UI for Mobile Drawer
      if (mobileAuthContainer) {
        mobileAuthContainer.innerHTML = `
          <div class="p-3 bg-body-tertiary rounded-3 border">
            <div class="d-flex align-items-center gap-3 mb-3">
              <img src="${currentUser.avatar}" class="rounded-circle" style="width: 42px; height: 42px; object-fit: cover;">
              <div class="flex-grow-1 overflow-hidden">
                <div class="fw-bold text-truncate">${currentUser.name}</div>
                <div class="text-muted extra-small text-truncate">${currentUser.dept || currentUser.role}</div>
              </div>
            </div>
            <div class="d-grid gap-2">
              <button class="btn btn-outline-primary btn-sm profile-trigger" data-tab="overview" data-bs-dismiss="offcanvas">
                <i class="bi bi-person-circle me-1"></i> Open Profile
              </button>
              ${isUserAdmin ? `
              <a href="#admin" class="btn btn-outline-warning btn-sm text-start" data-bs-dismiss="offcanvas">
                <i class="bi bi-shield-lock-fill me-1"></i> Admin Control Center
              </a>
              ` : ''}
              <button class="btn btn-outline-danger btn-sm text-start" id="mobile-logout-btn" data-bs-dismiss="offcanvas">
                <i class="bi bi-box-arrow-right me-1"></i> Logout Account
              </button>
            </div>
          </div>
        `;
      }
    } else {
      // Guest UI for Desktop Navbar
      navAuthContainer.innerHTML = `
        <button class="btn btn-nav-signin btn-sm" data-bs-toggle="modal" data-bs-target="#loginModal">
          <i class="bi bi-box-arrow-in-right me-1"></i> Sign In / Register
        </button>
      `;

      // Guest UI for Mobile Drawer
      if (mobileAuthContainer) {
        mobileAuthContainer.innerHTML = `
          <button class="btn btn-gradient w-100" data-bs-toggle="modal" data-bs-target="#loginModal" data-bs-dismiss="offcanvas">
            <i class="bi bi-box-arrow-in-right me-1"></i> Sign In / Register
          </button>
        `;
      }
    }

    // Attach profile trigger listeners
    document.querySelectorAll('.profile-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = btn.getAttribute('data-tab') || 'overview';
        openProfileTab(targetTab);
      });
    });

    // Attach Logout listeners
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        setCurrentUser(null);
        showToast('You have logged out successfully.', 'info');
      });
    }

    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', () => {
        setCurrentUser(null);
        showToast('You have logged out successfully.', 'info');
      });
    }

    // Update Profile Modal details if rendered
    renderProfileTabs();
    if (typeof bindSubmitMemoriesTriggers === 'function') {
      bindSubmitMemoriesTriggers();
    }
  }

  // Switch to specific tab inside Profile Modal
  function openProfileTab(tabName) {
    const profileModalEl = document.getElementById('profileModal');
    if (!profileModalEl) return;

    renderProfileTabs();
    renderProfileView();

    if (typeof bootstrap !== 'undefined') {
      const modal = bootstrap.Modal.getOrCreateInstance(profileModalEl);
      modal.show();
    }

    setTimeout(() => {
      const tabButton = document.getElementById(`${tabName}-tab-btn`);
      if (tabButton) {
        const tab = new bootstrap.Tab(tabButton);
        tab.show();
      }
    }, 150);
  }

  const profileModalEl = document.getElementById('profileModal');
  if (profileModalEl) {
    profileModalEl.addEventListener('show.bs.modal', () => {
      renderProfileTabs();
      renderProfileView();
    });
  }

  const DEFAULT_PROFILE_AVATAR = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&auto=format&fit=crop';
  const DEFAULT_COVER_BANNER = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop';

  // Helper to sync profile images (avatar & cover) across DOM elements
  async function syncProfileMediaDOM(user) {
    if (!user) return;

    let avatarUrl = user.avatar || DEFAULT_PROFILE_AVATAR;
    if (user.avatarKey) {
      avatarUrl = await imageStoreDB.resolveBlobUrl(user.avatarKey) || user.avatar || DEFAULT_PROFILE_AVATAR;
    } else if (user.avatar && !user.avatar.startsWith('http') && !user.avatar.startsWith('data:')) {
      avatarUrl = await imageStoreDB.resolveBlobUrl(user.avatar) || DEFAULT_PROFILE_AVATAR;
    }

    let coverUrl = user.coverPhoto || DEFAULT_COVER_BANNER;
    if (user.coverPhotoKey) {
      coverUrl = await imageStoreDB.resolveBlobUrl(user.coverPhotoKey) || user.coverPhoto || DEFAULT_COVER_BANNER;
    } else if (user.coverPhoto && !user.coverPhoto.startsWith('http') && !user.coverPhoto.startsWith('data:')) {
      coverUrl = await imageStoreDB.resolveBlobUrl(user.coverPhoto) || DEFAULT_COVER_BANNER;
    }

    // Update Avatar Images across site
    document.querySelectorAll('#prof-page-avatar, #profile-avatar-img, .nav-user-avatar').forEach(img => {
      img.src = avatarUrl;
    });

    // Update Cover Banners
    document.querySelectorAll('#prof-page-cover, #profile-modal-cover').forEach(banner => {
      banner.style.backgroundImage = `url('${coverUrl}')`;
    });

    return { avatarUrl, coverUrl };
  }

  async function updateUserProfileMedia(type, fileOrNull) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      showToast('You must be logged in to edit your profile.', 'warning');
      return;
    }

    if (fileOrNull) {
      const isAvatar = type === 'avatar';
      const labelName = isAvatar ? 'profile picture' : 'cover photo';
      showToast(`Compressing & processing ${labelName}...`, 'info');

      const maxDim = isAvatar ? 800 : 1920;
      compressImageToBlob(fileOrNull, maxDim, maxDim, 0.9, async (compressedBlob) => {
        if (!compressedBlob) {
          showToast(`Failed to process ${labelName}. Please try another file.`, 'danger');
          return;
        }

        try {
          showToast(`Saving ${labelName} to secure storage...`, 'info');
          const blobKey = await imageStoreDB.saveBlob(compressedBlob);
          const resolvedUrl = await imageStoreDB.resolveBlobUrl(blobKey);

          const users = getUsers();
          const updatedUser = { ...currentUser };

          if (isAvatar) {
            updatedUser.avatar = resolvedUrl || blobKey;
            updatedUser.avatarKey = blobKey;
          } else {
            updatedUser.coverPhoto = resolvedUrl || blobKey;
            updatedUser.coverPhotoKey = blobKey;
          }

          const userIndex = users.findIndex(u => u.id === currentUser.id);
          if (userIndex !== -1) {
            users[userIndex] = updatedUser;
            localStorage.setItem('campuslens_users', JSON.stringify(users));
          }
          setCurrentUser(updatedUser);

          await syncProfileMediaDOM(updatedUser);
          showToast(`${isAvatar ? 'Profile picture' : 'Cover photo'} updated successfully!`, 'success');
        } catch (err) {
          console.error('Error saving profile media:', err);
          showToast(`Error saving ${labelName}. Please try again.`, 'danger');
        }
      });
    } else {
      const isAvatar = type === 'avatar';
      const users = getUsers();
      const updatedUser = { ...currentUser };

      if (isAvatar) {
        updatedUser.avatar = DEFAULT_PROFILE_AVATAR;
        delete updatedUser.avatarKey;
      } else {
        updatedUser.coverPhoto = DEFAULT_COVER_BANNER;
        delete updatedUser.coverPhotoKey;
      }

      const userIndex = users.findIndex(u => u.id === currentUser.id);
      if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem('campuslens_users', JSON.stringify(users));
      }
      setCurrentUser(updatedUser);

      await syncProfileMediaDOM(updatedUser);

      const restoredLabel = isAvatar ? 'default avatar' : 'default cover banner';
      showToast(`${isAvatar ? 'Profile picture' : 'Cover photo'} removed. Restored ${restoredLabel}.`, 'info');
    }
  }

  function openProfileMediaInLightbox(type) {
    const currentUser = getCurrentUser() || defaultUsers[0];
    const isAvatar = type === 'avatar';
    const imgUrl = isAvatar 
      ? (currentUser.avatar || DEFAULT_PROFILE_AVATAR) 
      : (currentUser.coverPhoto || DEFAULT_COVER_BANNER);

    openMemoryInLightbox({
      id: `profile_${type}_${currentUser.id || 'user'}`,
      title: `${currentUser.name}'s ${isAvatar ? 'Profile Picture' : 'Cover Photo'}`,
      imageUrl: imgUrl,
      albumImages: [imgUrl],
      author: {
        name: currentUser.name,
        role: currentUser.role || 'Student Photographer',
        avatarUrl: currentUser.avatar || DEFAULT_PROFILE_AVATAR
      },
      location: currentUser.dept || 'Main Campus',
      date: 'Profile Photo',
      badgeLabel: isAvatar ? 'Avatar' : 'Cover Photo',
      description: `${currentUser.name}'s ${isAvatar ? 'profile avatar' : 'header cover photo'}.`
    });
  }

  function bindProfileMediaEventListeners() {
    // 1. Change Avatar Buttons
    const btnChangeAvatar = document.getElementById('btn-change-avatar');
    const btnModalChangeAvatar = document.getElementById('btn-modal-change-avatar');
    const inputAvatarFile = document.getElementById('prof-avatar-file-input');
    const inputModalAvatarFile = document.getElementById('modal-avatar-file-input');

    if (btnChangeAvatar && inputAvatarFile) {
      btnChangeAvatar.onclick = (e) => {
        e.stopPropagation();
        inputAvatarFile.click();
      };
    }
    if (btnModalChangeAvatar && inputModalAvatarFile) {
      btnModalChangeAvatar.onclick = (e) => {
        e.stopPropagation();
        inputModalAvatarFile.click();
      };
    }

    if (inputAvatarFile) {
      inputAvatarFile.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          updateUserProfileMedia('avatar', e.target.files[0]);
          e.target.value = '';
        }
      };
    }
    if (inputModalAvatarFile) {
      inputModalAvatarFile.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          updateUserProfileMedia('avatar', e.target.files[0]);
          e.target.value = '';
        }
      };
    }

    // 2. Change Cover Buttons
    const btnChangeCover = document.getElementById('btn-change-cover');
    const btnModalChangeCover = document.getElementById('btn-modal-change-cover');
    const inputCoverFile = document.getElementById('prof-cover-file-input');
    const inputModalCoverFile = document.getElementById('modal-cover-file-input');

    if (btnChangeCover && inputCoverFile) {
      btnChangeCover.onclick = (e) => {
        e.stopPropagation();
        inputCoverFile.click();
      };
    }
    if (btnModalChangeCover && inputModalCoverFile) {
      btnModalChangeCover.onclick = (e) => {
        e.stopPropagation();
        inputModalCoverFile.click();
      };
    }

    if (inputCoverFile) {
      inputCoverFile.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          updateUserProfileMedia('cover', e.target.files[0]);
          e.target.value = '';
        }
      };
    }
    if (inputModalCoverFile) {
      inputModalCoverFile.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          updateUserProfileMedia('cover', e.target.files[0]);
          e.target.value = '';
        }
      };
    }

    // 3. Remove Avatar Buttons
    const btnRemoveAvatar = document.getElementById('btn-remove-avatar');
    const btnModalRemoveAvatar = document.getElementById('btn-modal-remove-avatar');
    if (btnRemoveAvatar) {
      btnRemoveAvatar.onclick = (e) => {
        e.stopPropagation();
        updateUserProfileMedia('avatar', null);
      };
    }
    if (btnModalRemoveAvatar) {
      btnModalRemoveAvatar.onclick = (e) => {
        e.stopPropagation();
        updateUserProfileMedia('avatar', null);
      };
    }

    // 4. Remove Cover Buttons
    const btnRemoveCover = document.getElementById('btn-remove-cover');
    const btnModalRemoveCover = document.getElementById('btn-modal-remove-cover');
    if (btnRemoveCover) {
      btnRemoveCover.onclick = (e) => {
        e.stopPropagation();
        updateUserProfileMedia('cover', null);
      };
    }
    if (btnModalRemoveCover) {
      btnModalRemoveCover.onclick = (e) => {
        e.stopPropagation();
        updateUserProfileMedia('cover', null);
      };
    }

    // 5. View Avatar Lightbox Triggers
    const btnViewAvatar = document.getElementById('btn-view-avatar');
    const btnModalViewAvatar = document.getElementById('btn-modal-view-avatar');
    const profPageAvatarImg = document.getElementById('prof-page-avatar');
    const profileAvatarModalImg = document.getElementById('profile-avatar-img');

    if (btnViewAvatar) {
      btnViewAvatar.onclick = (e) => {
        e.stopPropagation();
        openProfileMediaInLightbox('avatar');
      };
    }
    if (btnModalViewAvatar) {
      btnModalViewAvatar.onclick = (e) => {
        e.stopPropagation();
        openProfileMediaInLightbox('avatar');
      };
    }
    if (profPageAvatarImg) {
      profPageAvatarImg.onclick = (e) => {
        if (e.target.closest('#prof-avatar-actions')) return;
        openProfileMediaInLightbox('avatar');
      };
    }
    if (profileAvatarModalImg) {
      profileAvatarModalImg.onclick = (e) => {
        if (e.target.closest('#modal-avatar-actions')) return;
        openProfileMediaInLightbox('avatar');
      };
    }

    // 6. View Cover Lightbox Triggers
    const btnViewCover = document.getElementById('btn-view-cover');
    const btnModalViewCover = document.getElementById('btn-modal-view-cover');
    const profPageCoverBanner = document.getElementById('prof-page-cover');
    const profileModalCoverBanner = document.getElementById('profile-modal-cover');

    if (btnViewCover) {
      btnViewCover.onclick = (e) => {
        e.stopPropagation();
        openProfileMediaInLightbox('cover');
      };
    }
    if (btnModalViewCover) {
      btnModalViewCover.onclick = (e) => {
        e.stopPropagation();
        openProfileMediaInLightbox('cover');
      };
    }
    if (profPageCoverBanner) {
      profPageCoverBanner.onclick = (e) => {
        if (e.target.closest('#prof-cover-actions') || e.target.closest('.btn-close')) return;
        openProfileMediaInLightbox('cover');
      };
    }
    if (profileModalCoverBanner) {
      profileModalCoverBanner.onclick = (e) => {
        if (e.target.closest('#modal-cover-actions') || e.target.closest('.btn-close')) return;
        openProfileMediaInLightbox('cover');
      };
    }
  }

  // Render contents of Profile Modal
  function renderProfileTabs() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    syncProfileMediaDOM(currentUser);

    const activeUser = getCurrentUser();
    const isOwner = activeUser && (activeUser.id === currentUser.id);
    document.querySelectorAll('#modal-cover-actions, #modal-avatar-actions').forEach(el => {
      if (isOwner) el.classList.remove('d-none');
      else el.classList.add('d-none');
    });

    // Update Header
    const avatarImg = document.getElementById('profile-avatar-img');
    const displayName = document.getElementById('profile-display-name');
    const displayRole = document.getElementById('profile-display-role');
    const displayDept = document.getElementById('profile-display-dept');
    const bioText = document.getElementById('profile-bio-text');
    const gearText = document.getElementById('profile-gear-text');
    const emailText = document.getElementById('profile-email-text');

    if (avatarImg) avatarImg.src = currentUser.avatar;
    if (displayName) displayName.innerText = currentUser.name;
    if (displayRole) displayRole.innerText = currentUser.role || 'Student Photographer';
    if (displayDept) displayDept.innerHTML = `<i class="bi bi-mortarboard me-1"></i>${currentUser.dept || 'Campus Media'}`;
    if (bioText) bioText.innerText = currentUser.bio || 'MULens Creator';
    if (gearText && currentUser.gear) gearText.innerHTML = `<div>• Gear: ${currentUser.gear}</div>`;
    if (emailText) emailText.innerText = currentUser.email;

    // Load Favorites & Albums
    const userFavs = getUserFavorites(currentUser.id);
    const userUploads = getUserUploads(currentUser);

    const favCountSpan = document.getElementById('profile-fav-count');
    const albumCountSpan = document.getElementById('profile-album-count');
    const statFavsGiven = document.getElementById('stat-favs-given');
    const statAlbumsUploaded = document.getElementById('stat-albums-uploaded');

    if (favCountSpan) favCountSpan.innerText = userFavs.length;
    if (albumCountSpan) albumCountSpan.innerText = userUploads.length;
    if (statFavsGiven) statFavsGiven.innerText = userFavs.length;
    if (statAlbumsUploaded) statAlbumsUploaded.innerText = userUploads.length;

    // Populate Favorites Grid inside Profile
    const favoritesGrid = document.getElementById('favorites-grid');
    if (favoritesGrid) {
      if (userFavs.length === 0) {
        favoritesGrid.innerHTML = `
          <div class="col-12 text-center py-5">
            <i class="bi bi-heart fs-1 text-muted opacity-50 mb-2"></i>
            <h6 class="fw-bold text-muted">No Saved Favorites Yet</h6>
            <p class="extra-small text-muted mb-3">Explore the main gallery and click the heart icon on any memory to save it here!</p>
            <a href="#featured-memories" class="btn btn-outline-primary btn-sm rounded-pill" data-bs-dismiss="modal">
              Explore Gallery
            </a>
          </div>
        `;
      } else {
        favoritesGrid.innerHTML = userFavs.map(fav => `
          <div class="col-6 col-md-4">
            <div class="fav-photo-card shadow-sm">
              <img src="${fav.img}" alt="${fav.title}" class="fav-photo-img" loading="lazy">
              <div class="fav-photo-overlay">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="badge bg-primary-subtle text-primary extra-small">${fav.tag || 'Gallery'}</span>
                  <button class="btn btn-danger btn-xs rounded-circle remove-fav-btn" data-id="${fav.id}" title="Remove from Favorites">
                    <i class="bi bi-trash-fill"></i>
                  </button>
                </div>
                <div class="text-white extra-small">
                  <div class="fw-bold text-truncate">${fav.title}</div>
                  <div class="opacity-75">${fav.author}</div>
                </div>
              </div>
            </div>
          </div>
        `).join('');

        // Remove fav listener
        favoritesGrid.querySelectorAll('.remove-fav-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const favId = btn.getAttribute('data-id');
            const updatedFavs = userFavs.filter(f => f.id !== favId);
            setUserFavorites(currentUser.id, updatedFavs);
            showToast('Removed photo from your favorites.', 'info');
          });
        });
      }
    }

    // Populate Albums Grid inside Profile
    const userAlbumsGrid = document.getElementById('user-albums-grid');
    if (userAlbumsGrid) {
      if (userUploads.length === 0) {
        userAlbumsGrid.innerHTML = `
          <div class="col-12 text-center py-5">
            <i class="bi bi-journal-album fs-1 text-muted opacity-50 mb-2"></i>
            <h6 class="fw-bold text-muted">No Uploaded Media Albums Yet</h6>
            <p class="extra-small text-muted mb-3">Publish your own high-res campus photography to feature in the archive.</p>
            <button class="btn btn-gradient btn-sm submit-memories-btn-trigger" data-bs-toggle="modal" data-bs-target="#uploadAlbumModal">
              <i class="bi bi-cloud-upload-fill me-1"></i> Upload First Photo
            </button>
          </div>
        `;
      } else {
        userAlbumsGrid.innerHTML = userUploads.map(mem => {
          const safeImg = normalizeImgUrl(mem.imageUrl);
          const albumImgs = (Array.isArray(mem.albumImages) && mem.albumImages.length > 0) ? mem.albumImages : [safeImg];
          const isAlbum = albumImgs.length > 1;
          const albumJson = encodeURIComponent(JSON.stringify(albumImgs));

          const authorName = mem.author ? (typeof mem.author === 'object' ? mem.author.name : mem.author) : 'Student Photographer';
          const authorRole = mem.author ? (typeof mem.author === 'object' ? (mem.author.role || 'Contributor') : 'Contributor') : 'Contributor';
          const authorAvatar = mem.author ? (typeof mem.author === 'object' ? (mem.author.avatarUrl || '') : '') : '';

          const canDel = canDeleteMemory(mem);

          return `
            <div class="col-6 col-md-4">
              <div class="memory-card memory-card-trigger fav-photo-card shadow-sm position-relative rounded-3 overflow-hidden ${isAlbum ? 'album-card-stacked' : ''}"
                   style="height: 180px; cursor: pointer;"
                   data-id="${mem.id}"
                   data-title="${mem.title.replace(/"/g, '&quot;')}"
                   data-img="${safeImg}"
                   data-album="${albumJson}"
                   data-author="${authorName.replace(/"/g, '&quot;')}"
                   data-author-role="${authorRole.replace(/"/g, '&quot;')}"
                   data-author-avatar="${authorAvatar}"
                   data-location="${(mem.location || 'Campus').replace(/"/g, '&quot;')}"
                   data-date="${mem.date || 'Recent'}"
                   data-tag="${mem.badgeLabel || mem.category || 'Gallery'}"
                   data-desc="${(mem.description || mem.title).replace(/"/g, '&quot;')}">
                <img src="${safeImg}" alt="${mem.title.replace(/"/g, '&quot;')}" class="fav-photo-img" loading="lazy">
                <div class="fav-photo-overlay d-flex flex-column justify-content-between p-2">
                  <div class="d-flex justify-content-between align-items-center gap-1">
                    <div class="d-flex align-items-center gap-1 overflow-hidden">
                      ${getStatusBadgeHtml(mem.status)}
                    </div>
                    ${canDel ? `
                    <button class="btn btn-danger btn-xs px-2 py-1 rounded-pill delete-memory-trigger shadow-sm" data-id="${mem.id}" title="Delete Memory Album">
                      <i class="bi bi-trash-fill"></i>
                    </button>
                    ` : ''}
                  </div>
                  <div class="text-white extra-small mt-2">
                    <div class="fw-bold text-truncate">${mem.title}</div>
                    <div class="opacity-75 d-flex justify-content-between align-items-center mt-1">
                      <span><i class="bi bi-geo-alt me-1"></i>${mem.location || 'Campus'}</span>
                      ${isAlbum ? `<span class="badge bg-warning text-dark extra-small">${albumImgs.length} Photos</span>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
      bindMemoryCardClickListeners();
    }

    // Populate Settings form fields
    const settingName = document.getElementById('settingName');
    const settingDept = document.getElementById('settingDept');
    const settingAvatar = document.getElementById('settingAvatar');
    const settingBio = document.getElementById('settingBio');
    const settingGear = document.getElementById('settingGear');

    if (settingName) settingName.value = currentUser.name || '';
    if (settingDept) settingDept.value = currentUser.dept || '';
    if (settingAvatar) settingAvatar.value = currentUser.avatar || '';
    if (settingBio) settingBio.value = currentUser.bio || '';
    if (settingGear) settingGear.value = currentUser.gear || '';
  }

  // Edit Settings shortcut button
  const editProfileBtn = document.getElementById('edit-profile-btn');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      const settingsTabBtn = document.getElementById('settings-tab-btn');
      if (settingsTabBtn && typeof bootstrap !== 'undefined') {
        const tab = new bootstrap.Tab(settingsTabBtn);
        tab.show();
      }
    });
  }

  // Edit Settings Form Submit
  const profileSettingsForm = document.getElementById('profile-settings-form');
  if (profileSettingsForm) {
    profileSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const newName = document.getElementById('settingName')?.value;
      const newDept = document.getElementById('settingDept')?.value;
      const newAvatar = document.getElementById('settingAvatar')?.value;
      const newBio = document.getElementById('settingBio')?.value;
      const newGear = document.getElementById('settingGear')?.value;
      const newPass = document.getElementById('settingNewPass')?.value;
      const confirmPass = document.getElementById('settingConfirmPass')?.value;

      if (newPass && newPass !== confirmPass) {
        showToast('New passwords do not match!', 'danger');
        return;
      }

      const users = getUsers();
      const updatedUser = {
        ...currentUser,
        name: newName || currentUser.name,
        dept: newDept || currentUser.dept,
        avatar: newAvatar || currentUser.avatar,
        bio: newBio || currentUser.bio,
        gear: newGear || currentUser.gear,
        password: newPass ? newPass : currentUser.password
      };

      // Update in users array & current user
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem('campuslens_users', JSON.stringify(users));
      }

      setCurrentUser(updatedUser);
      showToast('Profile settings saved successfully!', 'success');
    });
  }

  // --------------------------------------------------------------------------
  // 4. Guest Interception & Like Button Logic
  // --------------------------------------------------------------------------
  const likeBtns = document.querySelectorAll('.like-btn-trigger');
  likeBtns.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();

      const currentUser = getCurrentUser();
      if (!currentUser) {
        // Intercept Guest Action -> Open Guest Modal
        const guestModalEl = document.getElementById('guestModal');
        if (guestModalEl && typeof bootstrap !== 'undefined') {
          const guestModal = new bootstrap.Modal(guestModalEl);
          guestModal.show();
        }
        return;
      }

      // Logged in user -> toggle like and persist to favorites!
      btn.classList.toggle('liked');
      const heartIcon = btn.querySelector('i');
      const counterSpan = btn.querySelector('.like-count');

      // Find closest card info if available
      const memoryCard = btn.closest('.memory-card') || btn.closest('.potw-card');
      const photoTitle = memoryCard?.querySelector('.memory-title')?.innerText || memoryCard?.querySelector('h3')?.innerText || 'Campus Photo';
      const photoImg = memoryCard?.querySelector('.memory-img')?.src || memoryCard?.querySelector('.potw-img')?.src || '';
      const photoAuthor = memoryCard?.querySelector('.memory-author span')?.innerText || 'Campus Lens Photographer';

      const userFavs = getUserFavorites(currentUser.id);
      const isLiked = btn.classList.contains('liked');

      if (isLiked) {
        if (heartIcon) heartIcon.className = 'bi bi-heart-fill text-danger';
        if (counterSpan) {
          let count = parseInt(counterSpan.innerText || '0', 10);
          counterSpan.innerText = count + 1;
        }

        const newFav = {
          id: 'fav_' + index + '_' + Date.now(),
          title: photoTitle,
          img: photoImg,
          author: photoAuthor,
          location: 'Campus Ground',
          date: 'Spring 2026',
          tag: 'Gallery'
        };

        setUserFavorites(currentUser.id, [newFav, ...userFavs]);
        showToast('Saved to your Favorites!', 'success');
      } else {
        if (heartIcon) heartIcon.className = 'bi bi-heart';
        if (counterSpan) {
          let count = parseInt(counterSpan.innerText || '0', 10);
          counterSpan.innerText = Math.max(0, count - 1);
        }

        const updatedFavs = userFavs.filter(f => f.title !== photoTitle);
        setUserFavorites(currentUser.id, updatedFavs);
        showToast('Removed from your Favorites.', 'info');
      }
    });
  });

  // --------------------------------------------------------------------------
  // 5. Authentication Form Handlers (Login, Register, Demo, Forgot Pass)
  // --------------------------------------------------------------------------

  // Check pending upload intent after login/register
  function checkPendingUploadAndOpenModal() {
    if (sessionStorage.getItem('pending_upload_intent') === 'true') {
      sessionStorage.removeItem('pending_upload_intent');
      setTimeout(() => {
        showToast('Signed in! Opening photo submission modal...', 'success');
        const uploadModalEl = document.getElementById('uploadAlbumModal');
        if (uploadModalEl && typeof bootstrap !== 'undefined') {
          const modal = bootstrap.Modal.getOrCreateInstance(uploadModalEl);
          modal.show();
        }
      }, 400);
    }
  }

  // Handle Submit / Upload Memories click (Requires Auth)
  function handleSubmitMemoriesClick(e) {
    if (e) e.preventDefault();
    const currentUser = getCurrentUser();
    if (currentUser) {
      const uploadModalEl = document.getElementById('uploadAlbumModal');
      if (uploadModalEl && typeof bootstrap !== 'undefined') {
        const modal = bootstrap.Modal.getOrCreateInstance(uploadModalEl);
        modal.show();
      }
    } else {
      sessionStorage.setItem('pending_upload_intent', 'true');
      showToast('Please sign in or register to submit your campus memories.', 'info');
      const loginModalEl = document.getElementById('loginModal');
      if (loginModalEl && typeof bootstrap !== 'undefined') {
        const loginModal = bootstrap.Modal.getOrCreateInstance(loginModalEl);
        loginModal.show();
      }
    }
  }

  function bindSubmitMemoriesTriggers() {
    document.querySelectorAll('.submit-memories-btn-trigger, #hero-submit-memories-btn, #gallery-upload-photo-btn').forEach(btn => {
      btn.removeEventListener('click', handleSubmitMemoriesClick);
      btn.addEventListener('click', handleSubmitMemoriesClick);
    });
  }

  // Password Visibility Toggle
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling || btn.parentElement.querySelector('input[type="password"], input[type="text"]');
      if (!input) return;
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      const icon = btn.querySelector('i');
      if (icon) icon.className = isPass ? 'bi bi-eye-slash' : 'bi bi-eye';
    });
  });

  // Login Form Submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail')?.value.trim();
      const password = document.getElementById('loginPassword')?.value;

      const users = getUsers();
      const userMatch = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

      if (userMatch) {
        setCurrentUser(userMatch);
        showToast(`Welcome back, ${userMatch.name}!`, 'success');

        const loginModalEl = document.getElementById('loginModal');
        if (loginModalEl && typeof bootstrap !== 'undefined') {
          const modal = bootstrap.Modal.getInstance(loginModalEl);
          if (modal) modal.hide();
        }
        loginForm.reset();
        checkPendingUploadAndOpenModal();
      } else {
        showToast('Invalid email or password. Try a quick demo account.', 'danger');
      }
    });
  }

  // Demo Login 1-Click Buttons
  document.querySelectorAll('.demo-login-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-email');
      const users = getUsers();
      const userMatch = users.find(u => u.email === email);

      if (userMatch) {
        setCurrentUser(userMatch);
        showToast(`Signed in as ${userMatch.name} (${userMatch.role})`, 'success');

        const loginModalEl = document.getElementById('loginModal');
        if (loginModalEl && typeof bootstrap !== 'undefined') {
          const modal = bootstrap.Modal.getInstance(loginModalEl);
          if (modal) modal.hide();
        }
        checkPendingUploadAndOpenModal();
      }
    });
  });

  // Register Form Submission
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (document.getElementById('regModalFullName')?.value || document.getElementById('regName')?.value || '').trim();
      const studentId = (document.getElementById('regModalStudentId')?.value || '').trim();
      const dept = (document.getElementById('regModalDept')?.value || document.getElementById('regDept')?.value || 'CSE').trim();
      const email = (document.getElementById('regModalEmail')?.value || document.getElementById('regEmail')?.value || '').trim();
      const password = document.getElementById('regModalPassword')?.value || document.getElementById('regPassword')?.value;
      const confirmPassword = document.getElementById('regConfirmPassword')?.value;

      if (confirmPassword && password !== confirmPassword) {
        showToast('Passwords do not match. Please recheck.', 'danger');
        return;
      }

      if (!name || !email || !password) {
        showToast('Please complete all required fields.', 'warning');
        return;
      }

      const users = getUsers();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        showToast('An account with this email already exists. Please sign in.', 'warning');
        return;
      }

      const avatar = selectedRegistrationAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

      const newUser = {
        id: studentId || ('usr_' + Date.now()),
        name,
        email,
        password,
        dept: dept || "Campus Media",
        role: 'Student Creator',
        avatar: avatar,
        bio: `Member of ${dept} Dept. Campus media contributor.`,
        gear: 'Digital SLR Camera'
      };

      users.push(newUser);
      localStorage.setItem('campuslens_users', JSON.stringify(users));

      setCurrentUser(newUser);
      showToast(`🎉 Account created! Welcome to CampusLens, ${newUser.name}!`, 'success');

      const registerModalEl = document.getElementById('registerModal');
      if (registerModalEl && typeof bootstrap !== 'undefined') {
        const modal = bootstrap.Modal.getInstance(registerModalEl) || new bootstrap.Modal(registerModalEl);
        if (modal) modal.hide();
      }
      registerForm.reset();
      renderAuthState();
      updateRealtimeStatsCounters();
      checkPendingUploadAndOpenModal();
    });
  }

  // Forgot Password Form Submission
  const forgotPassForm = document.getElementById('forgot-password-form');
  if (forgotPassForm) {
    forgotPassForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('forgot-password-alert');
      if (alertBox) {
        alertBox.classList.remove('d-none');
      }
      showToast('Reset passcode dispatched to your email!', 'info');
    });
  }

  // --------------------------------------------------------------------------
  // 6. Dynamic Data Integration from data.ts & Interactive Controls
  // --------------------------------------------------------------------------

  function getApprovedPublicMemories() {
    const allMemories = getAllMemoriesCombined();
    return allMemories.filter(m => !m.status || m.status === 'approved');
  }

  function countApprovedMemoryPhotos(memories) {
    const uniqueImageUrls = new Set();

    memories.forEach((mem) => {
      const normalizedImages = [];

      if (Array.isArray(mem.albumImages) && mem.albumImages.length > 0) {
        normalizedImages.push(...mem.albumImages.map(img => normalizeImgUrl(img)).filter(Boolean));
      }

      const singleImage = normalizeImgUrl(mem.imageUrl);
      if (singleImage) {
        normalizedImages.push(singleImage);
      }

      normalizedImages.forEach((img) => {
        const key = img.trim().toLowerCase();
        if (key) uniqueImageUrls.add(key);
      });
    });

    return uniqueImageUrls.size;
  }

  // Real-Time Statistics Calculation Engine
  function updateRealtimeStatsCounters() {
    const approvedPublicMemories = getApprovedPublicMemories();
    const totalMemoriesArchived = approvedPublicMemories.length;
    const totalPhotosArchived = countApprovedMemoryPhotos(approvedPublicMemories);

    const allEvents = getAllEvents();
    const upcomingEventsCount = allEvents.filter((evt) => {
      const status = getEventDynamicStatus(evt);
      return status === 'Upcoming' || status === 'Today';
    }).length;

    const approvedVoicesCount = (window.__VOICES_GLOBAL && Array.isArray(window.__VOICES_GLOBAL.voices))
      ? window.__VOICES_GLOBAL.voices.filter(v => v && String(v.status || '').toLowerCase() === 'approved').length
      : 0;

    const photoEl = document.getElementById('stat-count-photos');
    const memoryEl = document.getElementById('stat-count-memories');
    const eventEl = document.getElementById('stat-count-events');
    const voiceEl = document.getElementById('stat-count-voices');

    if (photoEl) animateStatCounter(photoEl, totalPhotosArchived);
    if (memoryEl) animateStatCounter(memoryEl, totalMemoriesArchived);
    if (eventEl) animateStatCounter(eventEl, upcomingEventsCount);
    if (voiceEl) animateStatCounter(voiceEl, approvedVoicesCount);

    const footerMemEl = document.getElementById('footer-stat-memories');
    const footerEventEl = document.getElementById('footer-stat-events');
    const footerVoiceEl = document.getElementById('footer-stat-voices');

    if (footerMemEl) animateStatCounter(footerMemEl, totalMemoriesArchived);
    if (footerEventEl) animateStatCounter(footerEventEl, upcomingEventsCount);
    if (footerVoiceEl) animateStatCounter(footerVoiceEl, approvedVoicesCount);
  }

  function animateStatCounter(element, targetVal) {
    if (!element) return;
    const suffix = element.getAttribute('data-suffix') || '';
    const displayValue = targetVal === null || targetVal === undefined || Number.isNaN(Number(targetVal)) ? '—' : `${Number(targetVal).toLocaleString()}${suffix}`;

    if (targetVal === null || targetVal === undefined || Number.isNaN(Number(targetVal))) {
      element.innerText = '—';
      return;
    }

    let currentVal = parseInt(element.innerText.replace(/[^0-9]/g, ''), 10) || 0;

    if (currentVal === targetVal && element.innerText !== '0') {
      element.innerText = displayValue;
      return;
    }

    const duration = 1000;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const val = Math.floor(currentVal + (targetVal - currentVal) * easeProgress);

      element.innerText = val.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.innerText = targetVal.toLocaleString() + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  function renderDynamicDataFromDataTS() {
    if (!MULensData) return;

    // A. Render Site Configuration (Hero, Search Placeholder, Trending Tags)
    if (MULensData.SITE_CONFIG) {
      const badgeEl = document.querySelector('.hero-badge');
      if (badgeEl && MULensData.SITE_CONFIG.archiveBadge) {
        badgeEl.innerHTML = `<i class="bi bi-stars"></i> ${MULensData.SITE_CONFIG.archiveBadge}`;
      }

      const heroTitleEl = document.querySelector('.hero-title');
      if (heroTitleEl && MULensData.SITE_CONFIG.heroTitle && MULensData.SITE_CONFIG.heroHighlight) {
        heroTitleEl.innerHTML = `${MULensData.SITE_CONFIG.heroTitle} <span class="text-gradient">${MULensData.SITE_CONFIG.heroHighlight}</span>`;
      }

      const heroSubEl = document.querySelector('.hero-subtitle');
      if (heroSubEl && MULensData.SITE_CONFIG.heroSubtitle) {
        heroSubEl.innerText = MULensData.SITE_CONFIG.heroSubtitle;
      }

      const searchInputEl = document.getElementById('hero-search-input');
      if (searchInputEl && MULensData.SITE_CONFIG.searchPlaceholder) {
        searchInputEl.placeholder = MULensData.SITE_CONFIG.searchPlaceholder;
      }

      const quickTagsContainer = document.querySelector('.hero-quick-tags');
      if (quickTagsContainer && Array.isArray(MULensData.SITE_CONFIG.trendingTags)) {
        quickTagsContainer.innerHTML = `
          <span class="text-white-50 extra-small font-heading me-1"><i class="bi bi-fire text-warning me-1"></i>Trending:</span>
          ${MULensData.SITE_CONFIG.trendingTags.map(tag => `
            <button type="button" class="quick-tag-btn" data-tag="${tag.tag}">${tag.label}</button>
          `).join('')}
        `;
      }
    }

    // B. Render Hero Background Slides
    if (Array.isArray(MULensData.HERO_SLIDES) && MULensData.HERO_SLIDES.length > 0) {
      const heroBgSlider = document.querySelector('.hero-bg-slider');
      if (heroBgSlider) {
        const existingSlides = heroBgSlider.querySelectorAll('.hero-bg-slide');
        if (existingSlides.length !== MULensData.HERO_SLIDES.length) {
          heroBgSlider.innerHTML = MULensData.HERO_SLIDES.map((slide, index) => `
            <div class="hero-bg-slide ${index === 0 ? 'active' : ''}" style="background-image: url('${normalizeImgUrl(slide.imageUrl)}');"></div>
          `).join('');
        } else {
          existingSlides.forEach((slideEl, idx) => {
            const newUrl = normalizeImgUrl(MULensData.HERO_SLIDES[idx]?.imageUrl);
            if (newUrl) {
              slideEl.style.backgroundImage = `url('${newUrl}')`;
            }
          });
        }
      }
    }

    // C. Render Gallery Categories Filter Nav & Search Category Select Dropdown
    const currentActiveFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';

    if (Array.isArray(MULensData.GALLERY_CATEGORIES) && MULensData.GALLERY_CATEGORIES.length > 0) {
      const filterNav = document.querySelector('.filter-nav');
      if (filterNav) {
        filterNav.innerHTML = MULensData.GALLERY_CATEGORIES.map((cat) => `
          <button class="filter-btn ${cat.id === currentActiveFilter ? 'active' : ''}" data-filter="${cat.id}">
            ${cat.iconClass ? `<i class="bi ${cat.iconClass} me-1"></i>` : ''}${cat.label}
          </button>
        `).join('');
      }

      const searchSelect = document.getElementById('search-event');
      if (searchSelect) {
        const currentSearchVal = searchSelect.value;
        searchSelect.innerHTML = `
          <option value="">All Categories</option>
          ${MULensData.GALLERY_CATEGORIES.filter(c => c.id !== 'all').map(c => `
            <option value="${c.id}" ${c.id === currentSearchVal ? 'selected' : ''}>${c.label}</option>
          `).join('')}
        `;
      }
    }

    // D. Render Featured Campus Memories Masonry Grid
    let allMemories = getAllMemoriesCombined();

    // Public Gallery Filter: Only display approved memories (or default sample memories without status)
    const publicMemories = allMemories.filter(m => !m.status || m.status === 'approved');

    const masonryGrid = document.getElementById('gallery-masonry-grid');
    if (masonryGrid) {
      const activeFilterBtn = document.querySelector('.filter-btn.active');
      const activeFilter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';
      const searchInputVal = document.getElementById('hero-search-input')?.value.trim().toLowerCase();

      let displayMemories = [];
      if (searchInputVal) {
        displayMemories = publicMemories.filter(m => {
          const tagsStr = Array.isArray(m.tags) ? m.tags.join(' ') : '';
          const haystack = `${m.title} ${m.category} ${m.badgeLabel} ${tagsStr} ${m.location} ${m.description}`.toLowerCase();
          return haystack.includes(searchInputVal);
        });
      } else if (activeFilter && activeFilter !== 'all') {
        const filterNorm = activeFilter.toLowerCase().replace(/_/g, ' ').replace(/\s+department$/i, '').trim();
        displayMemories = publicMemories.filter(m => {
          const catNorm = (m.category || '').toLowerCase().replace(/_/g, ' ').replace(/\s+department$/i, '').trim();
          const badgeNorm = (m.badgeLabel || '').toLowerCase().replace(/_/g, ' ').replace(/\s+department$/i, '').trim();
          const tagsNorm = Array.isArray(m.tags) ? m.tags.map(t => t.toLowerCase().replace(/_/g, ' ').replace(/\s+department$/i, '').trim()) : [];

          return catNorm === filterNorm || 
                 (catNorm.length > 0 && filterNorm.includes(catNorm)) ||
                 (filterNorm.length > 0 && catNorm.includes(filterNorm)) ||
                 badgeNorm === filterNorm ||
                 (badgeNorm.length > 0 && filterNorm.includes(badgeNorm)) ||
                 (filterNorm.length > 0 && badgeNorm.includes(filterNorm)) ||
                 tagsNorm.includes(filterNorm);
        });
      } else {
        displayMemories = publicMemories;
      }

      if (displayMemories.length === 0) {
        masonryGrid.innerHTML = `
          <div class="col-12 text-center py-5 w-100">
            <div class="p-5 glass-panel rounded-4 text-center max-w-md mx-auto my-3 border border-dashed border-secondary border-opacity-25">
              <i class="bi bi-images display-3 text-muted opacity-50 mb-3 d-block"></i>
              <h5 class="fw-bold text-body mb-2">No Memories Found</h5>
              <p class="text-muted extra-small mb-0">No uploaded memories match the selected category or search filter.</p>
            </div>
          </div>
        `;
      } else {
        masonryGrid.innerHTML = displayMemories.map((mem, index) => {
          const safeImg = normalizeImgUrl(mem.imageUrl);
          const albumImgs = (Array.isArray(mem.albumImages) && mem.albumImages.length > 0) ? mem.albumImages : [safeImg];
          const isAlbum = albumImgs.length > 1;
          const albumJson = encodeURIComponent(JSON.stringify(albumImgs));

          const tagsStr = Array.isArray(mem.tags) ? mem.tags.join(' ') : '';
          const searchHaystack = `${mem.title} ${mem.category} ${mem.badgeLabel} ${tagsStr} ${mem.location} ${mem.description}`.toLowerCase();

          const aspectInlineStyle = mem.aspectRatio ? `style="aspect-ratio: ${mem.aspectRatio};"` : '';
          const aspectClass = mem.aspectRatio ? '' : (mem.aspectRatioClass || 'ratio-portrait-4-5');

          return `
          <div class="memory-item" data-category="${mem.category}" data-tag="${mem.category}" data-search="${searchHaystack}" data-aos="fade-up" data-aos-delay="${(index % 4) * 50 + 100}">
            <div class="memory-card memory-card-trigger ${aspectClass} ${isAlbum ? 'album-card-stacked' : ''}" ${aspectInlineStyle}
                 data-custom-uploaded="${mem.id && mem.id.startsWith('mem_custom_') ? 'true' : 'false'}"
                 data-id="${mem.id}"
                 data-title="${mem.title.replace(/"/g, '&quot;')}"
                 data-img="${safeImg}"
                 data-album="${albumJson}"
                 data-author="${mem.author.name.replace(/"/g, '&quot;')}"
                 data-author-role="${(mem.author.role || 'Contributor').replace(/"/g, '&quot;')}"
                 data-author-avatar="${mem.author.avatarUrl}"
                 data-location="${mem.location.replace(/"/g, '&quot;')}"
                 data-date="${mem.date}"
                 data-desc="${(mem.description || mem.title).replace(/"/g, '&quot;')}"
                 data-tag="${mem.badgeLabel}">
              <img src="${safeImg}" alt="${mem.title.replace(/"/g, '&quot;')}" class="memory-img" loading="lazy">
              
              <div class="memory-hover-overlay">
                <div class="hover-top-bar d-flex justify-content-between align-items-center">
                  <div class="d-flex align-items-center gap-1">
                    <span class="hover-category-badge">${mem.badgeIcon ? `<i class="bi ${mem.badgeIcon} me-1"></i>` : ''}${mem.badgeLabel}</span>
                    ${isAlbum ? `<span class="badge bg-warning text-dark border-0 fw-bold shadow-sm extra-small"><i class="bi bi-images me-1"></i>ALBUM (${albumImgs.length})</span>` : ''}
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    ${canDeleteMemory(mem) ? `
                    <button class="btn btn-danger btn-xs px-2 py-1 rounded-pill delete-memory-trigger shadow-sm" data-id="${mem.id}" title="Delete Memory Album">
                      <i class="bi bi-trash-fill"></i>
                    </button>
                    ` : ''}
                    <button class="memory-like-btn like-btn-trigger" aria-label="Like photo">
                      <i class="bi bi-heart"></i>
                    </button>
                  </div>
                </div>
                <div class="hover-bottom-info">
                  <h3 class="hover-photo-title">${mem.title}</h3>
                  <div class="hover-meta-row d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-2">
                      <img src="${mem.author.avatarUrl}" alt="${mem.author.name}" class="author-avatar">
                      <div>
                        <div class="author-name">${mem.author.name}</div>
                        <div class="photo-location"><i class="bi bi-geo-alt-fill text-cyan me-1"></i>${mem.location}</div>
                      </div>
                    </div>
                    <div class="photo-likes-pill">
                      <i class="bi bi-heart-fill text-danger me-1"></i><span class="like-count">${mem.likesCount || 1}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        }).join('');
      }
    }

    // Re-bind interactive events after grid DOM update
    renderProfileTabs();
    renderProfileView();
    bindGalleryFilters();
    bindHeroSearch();
    bindMemoryCardClickListeners();
    updateRealtimeStatsCounters();
    renderPOTWSection();
    renderUpcomingEvents();
    renderCampusVoices();

    // Auto-adjust aspect ratio for uploaded or dynamic images to preserve exact natural photo ratio
    setTimeout(() => {
      document.querySelectorAll('.memory-card-trigger').forEach(card => {
        const img = card.querySelector('img.memory-img');
        if (img) {
          const applyNaturalRatio = () => {
            if (img.naturalWidth && img.naturalHeight) {
              card.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
            }
          };
          if (img.complete && img.naturalWidth) {
            applyNaturalRatio();
          } else {
            img.addEventListener('load', applyNaturalRatio, { once: true });
          }
        }
      });
    }, 50);
  }

  // --------------------------------------------------------------------------
  // Campus Events Global Engine & Management
  // --------------------------------------------------------------------------
  let currentlySelectedEvent = null;
  let allEventsModalActiveCategory = 'all';
  let allEventsModalSearchQuery = '';
  let adminEventsFilter = 'all';
  let adminEventsSearch = '';

  function getAllEvents() {
    if (Array.isArray(window.__EVENTS_GLOBAL)) {
      return window.__EVENTS_GLOBAL;
    }
    return [];
  }

  function getEventDateSortValue(evt) {
    if (!evt) return 0;
    if (evt.date) {
      const fullDateStr = `${evt.date} ${evt.year || '2026'}`;
      const parsed = Date.parse(fullDateStr);
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  }

  function getEventDynamicStatus(evt) {
    if (!evt) return 'Upcoming';
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let eventDate = null;
    if (evt.date) {
      const fullDateStr = `${evt.date} ${evt.year || now.getFullYear()}`;
      const parsed = Date.parse(fullDateStr);
      if (!isNaN(parsed)) {
        eventDate = new Date(parsed);
      }
    }

    if (eventDate) {
      eventDate.setHours(0, 0, 0, 0);
      const diff = eventDate.getTime() - now.getTime();
      if (diff < 0) {
        return 'Past';
      } else if (diff === 0) {
        return 'Today';
      } else {
        return 'Upcoming';
      }
    }

    return evt.status || 'Upcoming';
  }

  function renderUpcomingEvents() {
    const container = document.getElementById('upcoming-events-container');
    const emptyState = document.getElementById('events-empty-state');
    if (!container) return;

    const eventsList = getAllEvents();

    // Public homepage only displays Upcoming & Today events, sorted by date (nearest first)
    const activeEvents = eventsList.filter(evt => {
      const status = getEventDynamicStatus(evt);
      return status === 'Upcoming' || status === 'Today';
    });

    activeEvents.sort((a, b) => getEventDateSortValue(a) - getEventDateSortValue(b));

    const displayEvents = activeEvents.slice(0, 4);

    if (displayEvents.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('d-none');
      return;
    }

    if (emptyState) emptyState.classList.add('d-none');

    container.innerHTML = displayEvents.map((evt, idx) => {
      const bannerImg = normalizeImgUrl(evt.imageUrl);
      const orgLogo = evt.organizerLogo ? normalizeImgUrl(evt.organizerLogo) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=150&auto=format&fit=crop';
      const catClass = evt.categoryClass || 'bg-primary-subtle text-primary border-primary-subtle';

      return `
        <div class="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay="${(idx % 4) * 100 + 100}">
          <div class="campus-event-card shadow-sm h-100" data-event-id="${evt.id}">
            <div class="event-banner-wrap">
              <img src="${bannerImg}" alt="${evt.title.replace(/"/g, '&quot;')}" class="event-banner-img" loading="lazy">
              <div class="event-banner-overlay"></div>
              <div class="event-floating-date">
                <div class="date-day">${evt.day || '15'}</div>
                <div class="date-month">${evt.month || 'MAY'}</div>
              </div>
              <div class="event-floating-category">
                <span class="badge rounded-pill ${catClass} border shadow-sm">${evt.category}</span>
              </div>
            </div>

            <div class="event-card-body">
              <div class="event-organizer-row">
                <img src="${orgLogo}" alt="${evt.organizer.replace(/"/g, '&quot;')}" class="event-organizer-logo">
                <span class="event-organizer-name text-truncate">${evt.organizer}</span>
              </div>

              <h4 class="event-card-title mb-2" title="${evt.title.replace(/"/g, '&quot;')}">${evt.title}</h4>

              <div class="event-meta-list">
                <div class="event-meta-item">
                  <i class="bi bi-geo-alt-fill"></i>
                  <span class="text-truncate">${evt.location}</span>
                </div>
                <div class="event-meta-item">
                  <i class="bi bi-clock"></i>
                  <span>${evt.time}</span>
                </div>
                <div class="event-meta-item">
                  <i class="bi bi-people"></i>
                  <span class="text-truncate">${evt.audience}</span>
                </div>
              </div>

              <div class="event-card-footer">
                <div>
                  <span class="badge bg-secondary-subtle text-secondary border extra-small">${evt.entryFee || 'Free Entry'}</span>
                </div>
                <button type="button" class="btn btn-outline-primary btn-sm rounded-pill px-3 view-event-details-btn" data-event-id="${evt.id}">
                  <i class="bi bi-info-circle me-1"></i> View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    bindEventCardListeners();
  }

  function bindEventCardListeners() {
    document.querySelectorAll('.view-event-details-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const evtId = btn.getAttribute('data-event-id');
        openEventDetailsModal(evtId);
      };
    });

    document.querySelectorAll('.campus-event-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.onclick = (e) => {
        if (e.target.closest('.view-event-details-btn')) return;
        const evtId = card.getAttribute('data-event-id');
        if (evtId) openEventDetailsModal(evtId);
      };
    });
  }

  function renderAllEventsModal() {
    const container = document.getElementById('all-events-modal-grid');
    const emptyState = document.getElementById('all-events-modal-empty');
    const countBadge = document.getElementById('all-events-modal-count');
    if (!container) return;

    const eventsList = getAllEvents();

    let filtered = eventsList.filter(evt => {
      if (allEventsModalActiveCategory !== 'all' && evt.category !== allEventsModalActiveCategory) {
        return false;
      }
      if (allEventsModalSearchQuery) {
        const q = allEventsModalSearchQuery.toLowerCase();
        const haystack = `${evt.title} ${evt.organizer} ${evt.category} ${evt.location} ${evt.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    // Sort: upcoming & today first, then past
    filtered.sort((a, b) => {
      const statusA = getEventDynamicStatus(a);
      const statusB = getEventDynamicStatus(b);
      if (statusA === 'Past' && statusB !== 'Past') return 1;
      if (statusA !== 'Past' && statusB === 'Past') return -1;
      return getEventDateSortValue(a) - getEventDateSortValue(b);
    });

    if (countBadge) countBadge.innerText = `${filtered.length} Events`;

    if (filtered.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('d-none');
      return;
    }

    if (emptyState) emptyState.classList.add('d-none');

    container.innerHTML = filtered.map(evt => {
      const bannerImg = normalizeImgUrl(evt.imageUrl);
      const orgLogo = evt.organizerLogo ? normalizeImgUrl(evt.organizerLogo) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=150&auto=format&fit=crop';
      const catClass = evt.categoryClass || 'bg-primary-subtle text-primary border-primary-subtle';
      const status = getEventDynamicStatus(evt);
      const isPast = status === 'Past';

      return `
        <div class="col-md-6 col-lg-4">
          <div class="campus-event-card shadow-sm h-100 ${isPast ? 'opacity-75' : ''}" data-event-id="${evt.id}">
            <div class="event-banner-wrap">
              <img src="${bannerImg}" alt="${evt.title.replace(/"/g, '&quot;')}" class="event-banner-img" loading="lazy">
              <div class="event-banner-overlay"></div>
              <div class="event-floating-date">
                <div class="date-day">${evt.day || '15'}</div>
                <div class="date-month">${evt.month || 'MAY'}</div>
              </div>
              <div class="event-floating-category d-flex gap-1">
                <span class="badge rounded-pill ${catClass} border shadow-sm">${evt.category}</span>
                ${isPast ? '<span class="badge rounded-pill bg-dark text-white border shadow-sm">Past</span>' : (status === 'Today' ? '<span class="badge rounded-pill bg-danger text-white border shadow-sm">Today</span>' : '')}
              </div>
            </div>

            <div class="event-card-body">
              <div class="event-organizer-row">
                <img src="${orgLogo}" alt="${evt.organizer.replace(/"/g, '&quot;')}" class="event-organizer-logo">
                <span class="event-organizer-name text-truncate">${evt.organizer}</span>
              </div>

              <h4 class="event-card-title mb-2" title="${evt.title.replace(/"/g, '&quot;')}">${evt.title}</h4>

              <div class="event-meta-list">
                <div class="event-meta-item">
                  <i class="bi bi-geo-alt-fill"></i>
                  <span class="text-truncate">${evt.location}</span>
                </div>
                <div class="event-meta-item">
                  <i class="bi bi-clock"></i>
                  <span>${evt.time}</span>
                </div>
                <div class="event-meta-item">
                  <i class="bi bi-people"></i>
                  <span class="text-truncate">${evt.audience}</span>
                </div>
              </div>

              <div class="event-card-footer">
                <div>
                  <span class="badge bg-secondary-subtle text-secondary border extra-small">${evt.entryFee || 'Free Entry'}</span>
                </div>
                <button type="button" class="btn btn-outline-primary btn-sm rounded-pill px-3 view-event-details-btn" data-event-id="${evt.id}">
                  <i class="bi bi-info-circle me-1"></i> View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.view-event-details-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const evtId = btn.getAttribute('data-event-id');
        openEventDetailsModal(evtId);
      };
    });

    container.querySelectorAll('.campus-event-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.onclick = (e) => {
        if (e.target.closest('.view-event-details-btn')) return;
        const evtId = card.getAttribute('data-event-id');
        if (evtId) openEventDetailsModal(evtId);
      };
    });
  }

  function openEventDetailsModal(eventId) {
    const eventsList = getAllEvents();
    const evt = eventsList.find(e => e.id === eventId);
    if (!evt) return;

    currentlySelectedEvent = evt;

    const modalEl = document.getElementById('eventDetailsModal');
    if (!modalEl) return;

    const bannerEl = document.getElementById('modalEventBanner');
    const titleEl = document.getElementById('modalEventTitle');
    const catBadgeEl = document.getElementById('modalEventCategoryBadge');
    const statusBadgeEl = document.getElementById('modalEventStatusBadge');
    const orgLogoEl = document.getElementById('modalEventOrganizerLogo');
    const orgNameEl = document.getElementById('modalEventOrganizerName');
    const orgRoleEl = document.getElementById('modalEventOrganizerRole');
    const orgSubEl = document.getElementById('modalEventOrganizerSub');
    const dateEl = document.getElementById('modalEventDate');
    const timeEl = document.getElementById('modalEventTime');
    const locEl = document.getElementById('modalEventLocation');
    const audEl = document.getElementById('modalEventAudience');
    const feeEl = document.getElementById('modalEventEntryFee');
    const deadlineEl = document.getElementById('modalEventDeadline');
    const descEl = document.getElementById('modalEventDescription');
    const highlightsWrap = document.getElementById('modalEventHighlightsWrap');
    const highlightsList = document.getElementById('modalEventHighlightsList');
    const contactEl = document.getElementById('modalEventContact');

    if (bannerEl) bannerEl.src = normalizeImgUrl(evt.imageUrl);
    if (titleEl) titleEl.innerText = evt.title;
    if (catBadgeEl) {
      catBadgeEl.innerText = evt.category;
      catBadgeEl.className = `badge rounded-pill ${evt.categoryClass || 'bg-primary-subtle text-primary border border-primary-subtle'}`;
    }
    if (statusBadgeEl) {
      statusBadgeEl.innerText = getEventDynamicStatus(evt);
    }
    if (orgLogoEl) orgLogoEl.src = evt.organizerLogo ? normalizeImgUrl(evt.organizerLogo) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=150&auto=format&fit=crop';
    if (orgNameEl) orgNameEl.innerText = evt.organizer;
    if (orgRoleEl) orgRoleEl.innerText = evt.organizerRole || 'Official University Club & Chapter';
    if (orgSubEl) orgSubEl.innerHTML = `<i class="bi bi-people me-1"></i> Organized by ${evt.organizer}`;
    if (dateEl) dateEl.innerText = `${evt.date}${evt.year ? `, ${evt.year}` : ''}`;
    if (timeEl) timeEl.innerText = evt.time;
    if (locEl) locEl.innerText = `${evt.location}${evt.venueDetail ? ` (${evt.venueDetail})` : ''}`;
    if (audEl) audEl.innerText = evt.audience;
    if (feeEl) feeEl.innerText = evt.entryFee;
    if (deadlineEl) deadlineEl.innerText = evt.registrationDeadline || 'Walk-in Welcome';
    if (descEl) descEl.innerText = evt.description;
    if (contactEl) contactEl.innerText = `${evt.contactEmail || 'events@university.edu'}${evt.contactPhone ? ` • ${evt.contactPhone}` : ''}`;

    if (highlightsWrap && highlightsList) {
      if (Array.isArray(evt.highlights) && evt.highlights.length > 0) {
        highlightsWrap.classList.remove('d-none');
        highlightsList.innerHTML = evt.highlights.map(h => `
          <li class="d-flex align-items-start gap-2 small text-muted">
            <i class="bi bi-check-circle-fill text-success flex-shrink-0 mt-1"></i>
            <span>${h}</span>
          </li>
        `).join('');
      } else {
        highlightsWrap.classList.add('d-none');
      }
    }

    if (typeof bootstrap !== 'undefined') {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.show();
    }
  }

  function bindEventModalActions() {
    const regBtn = document.getElementById('modalEventRegisterBtn');
    if (regBtn) {
      regBtn.onclick = () => {
        if (!currentlySelectedEvent) return;
        const currentUser = getCurrentUser();
        const studentName = currentUser ? currentUser.name : 'Student';
        
        if (currentlySelectedEvent.registrationUrl && currentlySelectedEvent.registrationUrl.startsWith('http') && !currentlySelectedEvent.registrationUrl.includes('google.com')) {
          showToast(`Opening registration portal for ${currentlySelectedEvent.title}...`, 'info');
          window.open(currentlySelectedEvent.registrationUrl, '_blank');
        } else {
          showToast(`Seat Confirmed for ${studentName}! Registration details recorded for ${currentlySelectedEvent.title}.`, 'success');
          const modalEl = document.getElementById('eventDetailsModal');
          if (modalEl && typeof bootstrap !== 'undefined') {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
          }
        }
      };
    }

    const shareBtn = document.getElementById('modalEventShareBtn');
    if (shareBtn) {
      shareBtn.onclick = async () => {
        if (!currentlySelectedEvent) return;
        const shareData = {
          title: currentlySelectedEvent.title,
          text: `Check out ${currentlySelectedEvent.title} on MULens: ${currentlySelectedEvent.date} at ${currentlySelectedEvent.location}`,
          url: window.location.href.split('#')[0] + '#upcoming-events'
        };

        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (e) {
            // fallback
          }
        } else {
          try {
            await navigator.clipboard.writeText(`${shareData.title} - ${shareData.url}`);
            showToast('Event details copied to clipboard!', 'success');
          } catch (e) {
            showToast('Event link copied!', 'info');
          }
        }
      };
    }

    const calBtn = document.getElementById('modalEventCalendarBtn');
    if (calBtn) {
      calBtn.onclick = () => {
        if (!currentlySelectedEvent) return;
        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(currentlySelectedEvent.title)}&details=${encodeURIComponent(currentlySelectedEvent.description)}&location=${encodeURIComponent(currentlySelectedEvent.location)}`;
        window.open(gcalUrl, '_blank');
        showToast('Opening Google Calendar...', 'info');
      };
    }
  }

  function bindAllEventsModalListeners() {
    document.querySelectorAll('#modal-event-category-filters .event-category-pill').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#modal-event-category-filters .event-category-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        allEventsModalActiveCategory = btn.getAttribute('data-event-category') || 'all';
        renderAllEventsModal();
      };
    });

    const modalSearch = document.getElementById('modal-events-search-input');
    if (modalSearch) {
      modalSearch.oninput = () => {
        allEventsModalSearchQuery = modalSearch.value.trim();
        renderAllEventsModal();
      };
    }

    const modalEl = document.getElementById('allEventsModal');
    if (modalEl) {
      modalEl.addEventListener('show.bs.modal', () => {
        renderAllEventsModal();
      });
    }
  }

  function renderAdminEventsManager() {
    const tableBody = document.getElementById('admin-events-table-body');
    const countBadge = document.getElementById('admin-events-count-badge');
    const filterAllCount = document.getElementById('admin-filter-all-count');
    const filterUpcomingCount = document.getElementById('admin-filter-upcoming-count');
    const filterTodayCount = document.getElementById('admin-filter-today-count');
    const filterPastCount = document.getElementById('admin-filter-past-count');

    if (!tableBody) return;

    const eventsList = getAllEvents();

    let totalCount = eventsList.length;
    let upcomingCount = 0;
    let todayCount = 0;
    let pastCount = 0;

    eventsList.forEach(evt => {
      const st = getEventDynamicStatus(evt);
      if (st === 'Today') todayCount++;
      else if (st === 'Past') pastCount++;
      else upcomingCount++;
    });

    if (countBadge) countBadge.innerText = `${totalCount} Events`;
    if (filterAllCount) filterAllCount.innerText = totalCount;
    if (filterUpcomingCount) filterUpcomingCount.innerText = upcomingCount;
    if (filterTodayCount) filterTodayCount.innerText = todayCount;
    if (filterPastCount) filterPastCount.innerText = pastCount;

    let displayList = eventsList.filter(evt => {
      const st = getEventDynamicStatus(evt);
      if (adminEventsFilter === 'upcoming' && st !== 'Upcoming') return false;
      if (adminEventsFilter === 'today' && st !== 'Today') return false;
      if (adminEventsFilter === 'past' && st !== 'Past') return false;

      if (adminEventsSearch) {
        const q = adminEventsSearch.toLowerCase();
        const haystack = `${evt.title} ${evt.organizer} ${evt.category} ${evt.location} ${evt.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (displayList.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5 text-muted">
            <i class="bi bi-calendar-x display-6 d-block mb-2 text-secondary opacity-50"></i>
            <span class="fw-semibold">No campus events found</span>
            <p class="extra-small mb-0 text-muted">Click "+ Add New Event" above to create your first event.</p>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = displayList.map(evt => {
      const bannerImg = normalizeImgUrl(evt.imageUrl);
      const orgLogo = evt.organizerLogo ? normalizeImgUrl(evt.organizerLogo) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=150&auto=format&fit=crop';
      const status = getEventDynamicStatus(evt);
      let statusBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle">Upcoming</span>';
      if (status === 'Today') {
        statusBadge = '<span class="badge bg-danger text-white border border-danger">Live Today</span>';
      } else if (status === 'Past') {
        statusBadge = '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Past Event</span>';
      }

      return `
        <tr>
          <td>
            <img src="${bannerImg}" alt="${evt.title.replace(/"/g, '&quot;')}" class="rounded border shadow-sm" style="width: 58px; height: 42px; object-fit: cover;">
          </td>
          <td>
            <div class="fw-bold text-truncate" style="max-width: 200px;">${evt.title}</div>
            <div class="d-flex align-items-center gap-1 mt-1">
              <span class="badge bg-primary-subtle text-primary extra-small">${evt.category}</span>
              <span class="text-muted extra-small text-truncate" style="max-width: 140px;">${evt.audience}</span>
            </div>
          </td>
          <td>
            <div class="fw-semibold text-truncate" style="max-width: 130px;">${evt.date}${evt.year ? `, ${evt.year}` : ''}</div>
            <div class="text-muted extra-small"><i class="bi bi-clock me-1"></i>${evt.time}</div>
          </td>
          <td>
            <div class="text-truncate" style="max-width: 140px;"><i class="bi bi-geo-alt-fill text-danger me-1"></i>${evt.location}</div>
            <div class="text-muted extra-small text-truncate" style="max-width: 140px;">${evt.venueDetail || ''}</div>
          </td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <img src="${orgLogo}" alt="${evt.organizer}" class="rounded-circle border" style="width: 22px; height: 22px; object-fit: cover;">
              <span class="fw-semibold text-truncate extra-small" style="max-width: 110px;">${evt.organizer}</span>
            </div>
          </td>
          <td>
            ${statusBadge}
          </td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-info btn-xs preview-admin-event-btn" data-id="${evt.id}" title="Preview Event Modal">
                <i class="bi bi-eye-fill"></i>
              </button>
              <button type="button" class="btn btn-outline-primary btn-xs edit-admin-event-btn" data-id="${evt.id}" title="Edit Event Details">
                <i class="bi bi-pencil-fill"></i>
              </button>
              <button type="button" class="btn btn-outline-danger btn-xs delete-admin-event-btn" data-id="${evt.id}" title="Delete Event">
                <i class="bi bi-trash-fill"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tableBody.querySelectorAll('.preview-admin-event-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const evtId = btn.getAttribute('data-id');
        openEventDetailsModal(evtId);
      };
    });

    tableBody.querySelectorAll('.edit-admin-event-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const evtId = btn.getAttribute('data-id');
        const evt = eventsList.find(ev => ev.id === evtId);
        if (evt) openAdminEventModal(evt);
      };
    });

    function handleEventActionResponse(resp, defaultFailMsg = 'Action failed') {
      if (!resp || resp.networkError || resp.status === 0) {
        showToast('Unable to connect to Campus Events server.', 'danger');
        return false;
      }
      if (!resp.ok) {
        if (resp.status === 401) {
          sessionStorage.removeItem('mulens_admin_secret');
          showToast('Admin verification failed. Please verify again.', 'danger');
          return false;
        }
        if (resp.status === 404) {
          showToast('Campus Events server endpoint was not found.', 'danger');
          return false;
        }
        const errMsg = resp.body ? (resp.body.error || resp.body.message || JSON.stringify(resp.body)) : defaultFailMsg;
        showToast(`Server error: ${errMsg}`, 'danger');
        return false;
      }
      if (resp.body && resp.body.success) {
        return true;
      }
      const errMsg = resp.body ? (resp.body.error || resp.body.message || JSON.stringify(resp.body)) : defaultFailMsg;
      showToast(`Server error: ${errMsg}`, 'danger');
      return false;
    }

    tableBody.querySelectorAll('.delete-admin-event-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const evtId = btn.getAttribute('data-id');
        const evt = eventsList.find(ev => ev.id === evtId);
        if (!evt) return;

        showCustomDeleteModal(async () => {
          const adminSecret = await ensureAdminSecret();
          if (!adminSecret) return;

          showToast(`Deleting event "${evt.title}"...`, 'info');
          const resp = await manageEventOnServer({
            action: 'delete',
            eventId: evt.id,
            adminSecret
          });

          if (!handleEventActionResponse(resp, 'Failed to delete event')) {
            return;
          }

          window.__EVENTS_GLOBAL = resp.body.events || [];
          renderUpcomingEvents();
          renderAllEventsModal();
          renderAdminEventsManager();
          showToast(`Event "${evt.title}" deleted successfully.`, 'success');
        });
      };
    });
  }

  function openAdminEventModal(eventToEdit = null) {
    const modalEl = document.getElementById('adminEventModal');
    const titleEl = document.getElementById('adminEventModalTitle');
    const formEl = document.getElementById('admin-event-form');
    if (!modalEl || !formEl) return;

    formEl.reset();

    const setInputVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = (val !== undefined && val !== null) ? val : '';
    };

    if (eventToEdit) {
      if (titleEl) titleEl.innerText = `Edit Event: ${eventToEdit.title}`;
      setInputVal('adminEventId', eventToEdit.id || '');
      setInputVal('adminEventTitle', eventToEdit.title || '');
      setInputVal('adminEventCategory', eventToEdit.category || 'Tech & Coding');
      setInputVal('adminEventStatus', eventToEdit.status || 'Upcoming');
      setInputVal('adminEventDate', eventToEdit.date || '');
      setInputVal('adminEventDay', eventToEdit.day || '15');
      setInputVal('adminEventMonth', eventToEdit.month || 'MAY');
      setInputVal('adminEventTime', eventToEdit.time || '');
      setInputVal('adminEventLocation', eventToEdit.location || '');
      setInputVal('adminEventVenueDetail', eventToEdit.venueDetail || '');
      setInputVal('adminEventOrganizer', eventToEdit.organizer || '');
      setInputVal('adminEventOrganizerRole', eventToEdit.organizerRole || '');
      setInputVal('adminEventOrganizerLogo', eventToEdit.organizerLogo || '');
      setInputVal('adminEventImgUrl', eventToEdit.imageUrl || '');
      setInputVal('adminEventAudience', eventToEdit.audience || '');
      setInputVal('adminEventEntryFee', eventToEdit.entryFee || 'Free Entry');
      setInputVal('adminEventDeadline', eventToEdit.registrationDeadline || '');
      setInputVal('adminEventRegUrl', eventToEdit.registrationUrl || '');
      setInputVal('adminEventContactEmail', eventToEdit.contactEmail || '');
      setInputVal('adminEventContactPhone', eventToEdit.contactPhone || '');
      setInputVal('adminEventDesc', eventToEdit.description || '');
      setInputVal('adminEventHighlights', Array.isArray(eventToEdit.highlights) ? eventToEdit.highlights.join('\n') : '');
    } else {
      if (titleEl) titleEl.innerText = 'Add New Campus Event';
      setInputVal('adminEventId', '');
      setInputVal('adminEventStatus', 'Upcoming');
      setInputVal('adminEventDay', '15');
      setInputVal('adminEventMonth', 'MAY');
      setInputVal('adminEventEntryFee', 'Free Entry with Student ID');
      setInputVal('adminEventAudience', 'Open for All Students');
      setInputVal('adminEventOrganizerLogo', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=150&auto=format&fit=crop');
    }

    if (typeof bootstrap !== 'undefined') {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.show();
    }
  }

  function bindAdminEventsListeners() {
    function handleEventActionResponse(resp, defaultFailMsg = 'Action failed') {
      if (!resp || resp.networkError || resp.status === 0) {
        showToast('Unable to connect to Campus Events server.', 'danger');
        return false;
      }
      if (!resp.ok) {
        if (resp.status === 401) {
          sessionStorage.removeItem('mulens_admin_secret');
          showToast('Admin verification failed. Please verify again.', 'danger');
          return false;
        }
        if (resp.status === 404) {
          showToast('Campus Events server endpoint was not found.', 'danger');
          return false;
        }
        const errMsg = resp.body ? (resp.body.error || resp.body.message || JSON.stringify(resp.body)) : defaultFailMsg;
        showToast(`Server error: ${errMsg}`, 'danger');
        return false;
      }
      if (resp.body && resp.body.success) {
        return true;
      }
      const errMsg = resp.body ? (resp.body.error || resp.body.message || JSON.stringify(resp.body)) : defaultFailMsg;
      showToast(`Server error: ${errMsg}`, 'danger');
      return false;
    }

    const addBtn = document.getElementById('admin-add-event-btn');
    if (addBtn) {
      addBtn.onclick = () => openAdminEventModal(null);
    }

    document.querySelectorAll('.preset-event-img, .admin-event-img-preset').forEach(btn => {
      btn.onclick = () => {
        const url = btn.getAttribute('data-url');
        const input = document.getElementById('adminEventImgUrl') || document.getElementById('adminEventImageUrl');
        if (input && url) {
          input.value = url;
          showToast('Applied sample event banner image', 'info');
        }
      };
    });

    document.querySelectorAll('.admin-event-filter-pill').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.admin-event-filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        adminEventsFilter = btn.getAttribute('data-status-filter') || 'all';
        renderAdminEventsManager();
      };
    });

    const searchInput = document.getElementById('admin-events-search-input');
    if (searchInput) {
      searchInput.oninput = () => {
        adminEventsSearch = searchInput.value.trim();
        renderAdminEventsManager();
      };
    }

    const resetBtn = document.getElementById('admin-reset-events-btn');
    if (resetBtn) {
      resetBtn.onclick = async () => {
        showCustomDeleteModal(async () => {
          const adminSecret = await ensureAdminSecret();
          if (!adminSecret) return;

          showToast('Resetting campus events to initial default schedule...', 'info');
          const resp = await manageEventOnServer({
            action: 'reset',
            adminSecret
          });

          if (!handleEventActionResponse(resp, 'Failed to reset events')) {
            return;
          }

          window.__EVENTS_GLOBAL = resp.body.events || [];
          renderUpcomingEvents();
          renderAllEventsModal();
          renderAdminEventsManager();
          showToast('Campus events reset to defaults successfully.', 'success');
        });
      };
    }

    const formEl = document.getElementById('admin-event-form');
    if (formEl) {
      formEl.onsubmit = async (e) => {
        e.preventDefault();

        const getVal = (id, def = '') => {
          const el = document.getElementById(id);
          return el ? el.value.trim() : def;
        };

        const existingId = getVal('adminEventId');
        const isEdit = !!existingId;

        const title = getVal('adminEventTitle');
        const category = getVal('adminEventCategory', 'Tech & Coding');
        const status = getVal('adminEventStatus', 'Upcoming');
        const date = getVal('adminEventDate');
        let day = getVal('adminEventDay', '15');
        let month = getVal('adminEventMonth', 'MAY');
        const time = getVal('adminEventTime');
        const location = getVal('adminEventLocation');
        const venueDetail = getVal('adminEventVenueDetail');
        const organizer = getVal('adminEventOrganizer');
        const organizerRole = getVal('adminEventOrganizerRole');
        const organizerLogo = getVal('adminEventOrganizerLogo');
        const imageUrl = getVal('adminEventImgUrl') || getVal('adminEventImageUrl');
        const audience = getVal('adminEventAudience');
        const entryFee = getVal('adminEventEntryFee');
        const regDeadline = getVal('adminEventDeadline') || getVal('adminEventRegDeadline');
        const regUrl = getVal('adminEventRegUrl');
        const contactEmail = getVal('adminEventContactEmail');
        const contactPhone = getVal('adminEventContactPhone');
        const description = getVal('adminEventDesc') || getVal('adminEventDescription');
        const rawHighlights = getVal('adminEventHighlights');
        const highlights = rawHighlights ? rawHighlights.split('\n').map(s => s.trim()).filter(Boolean) : [];

        let year = new Date().getFullYear();
        if (date) {
          const parts = date.split(/[\s,]+/);
          if (parts.length >= 3) {
            const possibleYear = parseInt(parts[2], 10);
            if (!isNaN(possibleYear)) year = possibleYear;
          }
          if (!day && parts.length >= 2) {
            day = isNaN(parts[0]) ? parts[1] : parts[0];
          }
          if (!month && parts.length >= 2) {
            month = isNaN(parts[0]) ? parts[0].substring(0, 3).toUpperCase() : parts[1].substring(0, 3).toUpperCase();
          }
        }

        let categoryClass = 'bg-primary-subtle text-primary border-primary-subtle';
        if (category.includes('Tech') || category.includes('Code')) categoryClass = 'bg-info-subtle text-info border-info-subtle';
        else if (category.includes('Cultural') || category.includes('Art')) categoryClass = 'bg-warning-subtle text-warning border-warning-subtle';
        else if (category.includes('Sport') || category.includes('Athletic')) categoryClass = 'bg-success-subtle text-success border-success-subtle';
        else if (category.includes('Seminar') || category.includes('Workshop') || category.includes('Talk')) categoryClass = 'bg-secondary-subtle text-secondary border-secondary-subtle';
        else if (category.includes('Music') || category.includes('Concert') || category.includes('Fest')) categoryClass = 'bg-danger-subtle text-danger border-danger-subtle';

        const eventObj = {
          id: isEdit ? existingId : ('evt_' + Date.now()),
          title,
          category,
          categoryClass,
          status,
          day,
          month,
          year,
          date: date || `${month} ${day}, ${year}`,
          time: time || '10:00 AM - 04:00 PM',
          location: location || 'Campus Main Auditorium',
          venueDetail,
          organizer: organizer || 'University Event Committee',
          organizerRole: organizerRole || 'Official Student Chapter',
          organizerLogo: organizerLogo || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=150&auto=format&fit=crop',
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop',
          audience: audience || 'Open for All Students',
          entryFee: entryFee || 'Free Entry',
          registrationDeadline: regDeadline,
          registrationUrl: regUrl,
          contactEmail: contactEmail || 'events@university.edu',
          contactPhone,
          description: description || title,
          highlights
        };

        const adminSecret = await ensureAdminSecret();
        if (!adminSecret) return;

        showToast(isEdit ? `Updating event "${title}"...` : `Creating event "${title}"...`, 'info');

        const resp = await manageEventOnServer({
          action: isEdit ? 'update' : 'create',
          event: eventObj,
          adminSecret
        });

        if (!handleEventActionResponse(resp, isEdit ? 'Failed to update event' : 'Failed to create event')) {
          return;
        }

        window.__EVENTS_GLOBAL = resp.body.events || [];

        const modalEl = document.getElementById('adminEventModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) modalInstance.hide();
        }

        renderUpcomingEvents();
        renderAllEventsModal();
        renderAdminEventsManager();
        showToast(isEdit ? `Event "${title}" updated successfully!` : `Event "${title}" published to live campus schedule!`, 'success');
      };
    }
  }

  // --------------------------------------------------------------------------
  // Campus Voices Community Wall & Moderation Engine
  // --------------------------------------------------------------------------
  let adminVoicesFilter = 'all';
  let adminVoicesSearch = '';
  let allVoicesModalFilter = 'all';
  let pendingVoiceDeleteId = null;

  function safeEscapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getAllCampusVoices() {
    if (window.__VOICES_GLOBAL && Array.isArray(window.__VOICES_GLOBAL.voices)) {
      return window.__VOICES_GLOBAL.voices;
    }
    return [];
  }

  function getFeaturedVoiceId() {
    if (window.__VOICES_GLOBAL && window.__VOICES_GLOBAL.featuredVoiceId) {
      return window.__VOICES_GLOBAL.featuredVoiceId;
    }
    return null;
  }

  function getVoiceCategoryBadgeClass(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('memory')) return 'voice-badge-memory';
    if (cat.includes('appreciation')) return 'voice-badge-appreciation';
    if (cat.includes('life')) return 'voice-badge-life';
    if (cat.includes('club') || cat.includes('event')) return 'voice-badge-club';
    if (cat.includes('suggestion')) return 'voice-badge-suggestion';
    return 'voice-badge-memory';
  }

  function formatVoiceDate(dateStr) {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }

  function handleVoiceActionResponse(resp, defaultMsg = 'Operation failed') {
    if (resp && resp.ok && resp.body && resp.body.success) {
      return true;
    }
    if (resp && resp.status === 401) {
      sessionStorage.removeItem('mulens_admin_secret');
      showToast('Admin verification failed. Invalid or missing admin secret.', 'danger');
      return false;
    }
    const errorMsg = (resp && resp.body && resp.body.error) || (resp && resp.error) || defaultMsg;
    showToast(errorMsg, 'danger');
    return false;
  }

  // Render Homepage Campus Voices section
  function renderCampusVoices() {
    const container = document.getElementById('campus-voices-container');
    if (!container) return;

    const totalBadge = document.getElementById('voices-total-badge');
    const viewAllBtn = document.getElementById('view-all-voices-btn');

    const allVoices = getAllCampusVoices();
    const approvedVoices = allVoices.filter(v => v.status === 'approved');

    if (totalBadge) {
      totalBadge.innerText = approvedVoices.length;
    }

    if (viewAllBtn) {
      if (approvedVoices.length > 3) {
        viewAllBtn.classList.remove('d-none');
      } else {
        viewAllBtn.classList.add('d-none');
      }
    }

    if (approvedVoices.length === 0) {
      container.innerHTML = `
        <div class="col-12">
          <div class="glass-panel p-5 text-center rounded-4 border">
            <div class="mb-3">
              <i class="bi bi-chat-heart text-primary fs-1 opacity-75"></i>
            </div>
            <h4 class="font-heading fw-bold mb-2">Be The First Campus Voice</h4>
            <p class="text-muted small mx-auto mb-4" style="max-width: 480px;">
              Share a memorable university moment, faculty appreciation, festival reflection, or constructive thought for the Metropolitan University community.
            </p>
            <button type="button" class="btn btn-primary btn-sm px-4 rounded-pill fw-bold shadow-sm" data-bs-toggle="modal" data-bs-target="#shareVoiceModal">
              <i class="bi bi-pencil-square me-1"></i> Share Your Voice
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Determine Featured Voice
    const featuredId = getFeaturedVoiceId();
    let featuredVoice = approvedVoices.find(v => v.id === featuredId);
    if (!featuredVoice) {
      featuredVoice = approvedVoices[0];
    }

    // Determine secondary voices (up to 2)
    const secondaryVoices = approvedVoices.filter(v => v.id !== featuredVoice.id).slice(0, 2);

    const renderCardHtml = (v, isFeatured = false) => {
      const isAnon = !!v.anonymous;
      const authorName = isAnon ? 'Anonymous Student' : (safeEscapeHtml(v.name) || 'Campus Creator');
      const deptBatch = [v.department ? safeEscapeHtml(v.department) : 'Metropolitan University', v.batch ? safeEscapeHtml(v.batch) : ''].filter(Boolean).join(' • ');
      const avatarUrl = isAnon
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'
        : (v.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop');
      const badgeClass = getVoiceCategoryBadgeClass(v.category);
      const dateStr = formatVoiceDate(v.createdAt);

      if (isFeatured) {
        return `
          <div class="col-lg-6 col-12 mb-3 mb-lg-0">
            <div class="campus-voice-card featured-voice-card h-100 p-4 p-md-5 d-flex flex-column justify-content-between">
              <div>
                <div class="d-flex align-items-center justify-content-between gap-2 mb-4">
                  <span class="featured-voice-pill">
                    <i class="bi bi-star-fill"></i> Featured Voice
                  </span>
                  <span class="voice-category-badge ${badgeClass}">
                    ${safeEscapeHtml(v.category || 'Campus Memory')}
                  </span>
                </div>
                <div class="voice-quote-text font-serif mb-4" style="font-size: 1.15rem; line-height: 1.7;">
                  "${safeEscapeHtml(v.text)}"
                </div>
              </div>
              <div class="d-flex align-items-center justify-content-between pt-3 border-top mt-2">
                <div class="d-flex align-items-center gap-3">
                  <img src="${avatarUrl}" class="voice-avatar rounded-circle" alt="${authorName}" style="width: 44px; height: 44px; object-fit: cover;">
                  <div>
                    <div class="fw-bold small ${isAnon ? 'fst-italic text-muted' : ''}">${authorName}</div>
                    <div class="text-muted extra-small">${deptBatch}</div>
                  </div>
                </div>
                <div class="text-muted extra-small">
                  <i class="bi bi-clock me-1"></i>${dateStr}
                </div>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="campus-voice-card p-4 d-flex flex-column justify-content-between mb-3 last-mb-0 h-100">
          <div>
            <div class="d-flex align-items-center justify-content-between gap-2 mb-3">
              <span class="voice-category-badge ${badgeClass}">
                ${safeEscapeHtml(v.category || 'Campus Memory')}
              </span>
              <span class="text-muted extra-small">
                <i class="bi bi-clock me-1"></i>${dateStr}
              </span>
            </div>
            <div class="voice-quote-text mb-3" style="font-size: 0.95rem; line-height: 1.6;">
              "${safeEscapeHtml(v.text)}"
            </div>
          </div>
          <div class="d-flex align-items-center gap-3 pt-3 border-top mt-auto">
            <img src="${avatarUrl}" class="voice-avatar rounded-circle" alt="${authorName}" style="width: 36px; height: 36px; object-fit: cover;">
            <div>
              <div class="fw-bold extra-small ${isAnon ? 'fst-italic text-muted' : ''}">${authorName}</div>
              <div class="text-muted extra-small" style="font-size: 0.72rem;">${deptBatch}</div>
            </div>
          </div>
        </div>
      `;
    };

    if (secondaryVoices.length === 0) {
      // Only 1 voice exists
      container.innerHTML = `
        <div class="col-lg-8 mx-auto col-12">
          ${renderCardHtml(featuredVoice, true)}
        </div>
      `;
    } else if (secondaryVoices.length === 1) {
      // 2 voices exist
      container.innerHTML = `
        <div class="col-lg-6 col-12 mb-3 mb-lg-0">
          ${renderCardHtml(featuredVoice, true)}
        </div>
        <div class="col-lg-6 col-12">
          ${renderCardHtml(secondaryVoices[0], false)}
        </div>
      `;
    } else {
      // 3 or more voices
      container.innerHTML = `
        ${renderCardHtml(featuredVoice, true)}
        <div class="col-lg-6 col-12 d-flex flex-column gap-3">
          ${secondaryVoices.map(v => `<div>${renderCardHtml(v, false)}</div>`).join('')}
        </div>
      `;
    }
  }

  // Render All Voices Modal Archive
  function renderAllVoicesModal() {
    const container = document.getElementById('all-voices-grid-container');
    const emptyEl = document.getElementById('all-voices-empty');
    if (!container) return;

    const allVoices = getAllCampusVoices();
    const approvedVoices = allVoices.filter(v => v.status === 'approved');

    let filtered = approvedVoices;
    if (allVoicesModalFilter && allVoicesModalFilter !== 'all') {
      filtered = approvedVoices.filter(v => (v.category || '').toLowerCase() === allVoicesModalFilter.toLowerCase());
    }

    if (filtered.length === 0) {
      container.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('d-none');
      return;
    }

    if (emptyEl) emptyEl.classList.add('d-none');

    const featuredId = getFeaturedVoiceId();

    container.innerHTML = filtered.map(v => {
      const isAnon = !!v.anonymous;
      const authorName = isAnon ? 'Anonymous Student' : (safeEscapeHtml(v.name) || 'Campus Creator');
      const deptBatch = [v.department ? safeEscapeHtml(v.department) : 'Metropolitan University', v.batch ? safeEscapeHtml(v.batch) : ''].filter(Boolean).join(' • ');
      const avatarUrl = isAnon
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'
        : (v.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop');
      const badgeClass = getVoiceCategoryBadgeClass(v.category);
      const dateStr = formatVoiceDate(v.createdAt);
      const isFeatured = String(v.id) === String(featuredId);

      return `
        <div class="col-md-6 col-lg-4 d-flex">
          <div class="campus-voice-card p-4 d-flex flex-column justify-content-between w-100 ${isFeatured ? 'border-primary' : ''}">
            <div>
              <div class="d-flex align-items-center justify-content-between gap-2 mb-3">
                <span class="voice-category-badge ${badgeClass}">
                  ${safeEscapeHtml(v.category || 'Campus Memory')}
                </span>
                ${isFeatured ? '<span class="badge bg-warning text-dark extra-small"><i class="bi bi-star-fill me-1"></i>Featured</span>' : ''}
              </div>
              <div class="voice-quote-text mb-4" style="font-size: 0.95rem; line-height: 1.6;">
                "${safeEscapeHtml(v.text)}"
              </div>
            </div>
            <div class="d-flex align-items-center justify-content-between pt-3 border-top mt-auto">
              <div class="d-flex align-items-center gap-2">
                <img src="${avatarUrl}" class="voice-avatar rounded-circle" alt="${authorName}" style="width: 34px; height: 34px; object-fit: cover;">
                <div class="text-truncate" style="max-width: 140px;">
                  <div class="fw-bold extra-small text-truncate ${isAnon ? 'fst-italic text-muted' : ''}">${authorName}</div>
                  <div class="text-muted extra-small text-truncate" style="font-size: 0.7rem;">${deptBatch}</div>
                </div>
              </div>
              <div class="text-muted extra-small" style="font-size: 0.7rem;">
                ${dateStr}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Admin Voices Manager Tab Pane
  function renderAdminVoicesManager() {
    const tableBody = document.getElementById('admin-voices-table-body');
    const emptyState = document.getElementById('admin-voices-empty-state');
    if (!tableBody) return;

    const allVoices = getAllCampusVoices();
    const featuredId = getFeaturedVoiceId();

    const pendingCount = allVoices.filter(v => v.status === 'pending').length;
    const approvedCount = allVoices.filter(v => v.status === 'approved').length;
    const rejectedCount = allVoices.filter(v => v.status === 'rejected').length;

    const countBadge = document.getElementById('admin-voices-count-badge');
    const filterAllCount = document.getElementById('admin-voices-filter-all-count');
    const filterPendingCount = document.getElementById('admin-voices-filter-pending-count');
    const filterApprovedCount = document.getElementById('admin-voices-filter-approved-count');
    const filterRejectedCount = document.getElementById('admin-voices-filter-rejected-count');

    if (countBadge) countBadge.innerText = pendingCount > 0 ? `${pendingCount} Pending` : allVoices.length;
    if (filterAllCount) filterAllCount.innerText = allVoices.length;
    if (filterPendingCount) filterPendingCount.innerText = pendingCount;
    if (filterApprovedCount) filterApprovedCount.innerText = approvedCount;
    if (filterRejectedCount) filterRejectedCount.innerText = rejectedCount;

    let filtered = allVoices;
    if (adminVoicesFilter && adminVoicesFilter !== 'all') {
      filtered = allVoices.filter(v => v.status === adminVoicesFilter);
    }

    if (adminVoicesSearch) {
      const q = adminVoicesSearch.toLowerCase().trim();
      filtered = filtered.filter(v => {
        const text = `${v.text || ''} ${v.name || ''} ${v.department || ''} ${v.category || ''} ${v.batch || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = '';
      if (emptyState) emptyState.classList.remove('d-none');
      return;
    }

    if (emptyState) emptyState.classList.add('d-none');

    tableBody.innerHTML = filtered.map(v => {
      const isAnon = !!v.anonymous;
      const authorName = safeEscapeHtml(v.name || (isAnon ? 'Anonymous' : 'Student'));
      const dept = safeEscapeHtml(v.department || 'General');
      const batch = safeEscapeHtml(v.batch || '-');
      const badgeClass = getVoiceCategoryBadgeClass(v.category);
      const isFeatured = String(v.id) === String(featuredId);
      const dateStr = formatVoiceDate(v.createdAt);

      let statusBadge = `<span class="badge bg-warning text-dark extra-small"><i class="bi bi-clock me-1"></i>Pending</span>`;
      if (v.status === 'approved') {
        statusBadge = `<span class="badge bg-success text-white extra-small"><i class="bi bi-check-circle me-1"></i>Published</span>`;
      } else if (v.status === 'rejected') {
        statusBadge = `<span class="badge bg-danger text-white extra-small"><i class="bi bi-x-circle me-1"></i>Rejected</span>`;
      }

      return `
        <tr data-voice-id="${v.id}">
          <td>
            <span class="voice-category-badge ${badgeClass}">${safeEscapeHtml(v.category || 'Memory')}</span>
          </td>
          <td>
            <div class="fw-semibold text-dark text-truncate" style="max-width: 280px;" title="${safeEscapeHtml(v.text)}">
              "${safeEscapeHtml(v.text)}"
            </div>
            ${isFeatured ? '<span class="badge bg-warning text-dark extra-small mt-1"><i class="bi bi-star-fill me-1"></i>Featured on Homepage</span>' : ''}
          </td>
          <td>
            <div class="fw-bold extra-small text-truncate">${authorName}</div>
            ${isAnon ? '<span class="badge bg-secondary-subtle text-secondary extra-small">Anonymous Post</span>' : ''}
          </td>
          <td>
            <div class="extra-small text-muted">${dept}</div>
            <div class="extra-small text-muted" style="font-size: 0.7rem;">${batch}</div>
          </td>
          <td>
            ${statusBadge}
          </td>
          <td>
            <span class="text-muted extra-small">${dateStr}</span>
          </td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-info btn-xs admin-voice-view-btn" data-id="${v.id}" title="View Details">
                <i class="bi bi-eye-fill"></i>
              </button>
              ${v.status !== 'approved' ? `
                <button type="button" class="btn btn-outline-success btn-xs admin-voice-approve-btn" data-id="${v.id}" title="Approve & Publish">
                  <i class="bi bi-check-lg"></i> Approve
                </button>
              ` : ''}
              ${v.status !== 'rejected' ? `
                <button type="button" class="btn btn-outline-warning btn-xs admin-voice-reject-btn" data-id="${v.id}" title="Reject Submission">
                  <i class="bi bi-x-lg"></i> Reject
                </button>
              ` : ''}
              ${v.status === 'approved' ? `
                <button type="button" class="btn ${isFeatured ? 'btn-warning' : 'btn-outline-primary'} btn-xs admin-voice-feature-btn" data-id="${v.id}" title="${isFeatured ? 'Remove as Featured Voice' : 'Set as Featured Voice'}">
                  <i class="bi bi-star-fill"></i> ${isFeatured ? 'Featured' : 'Feature'}
                </button>
              ` : ''}
              <button type="button" class="btn btn-outline-danger btn-xs admin-voice-delete-btn" data-id="${v.id}" title="Delete Voice">
                <i class="bi bi-trash-fill"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind Admin Voices Row Actions
    tableBody.querySelectorAll('.admin-voice-view-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const voice = allVoices.find(v => String(v.id) === String(id));
        if (!voice) return;

        const idEl = document.getElementById('admin-view-voice-id');
        const catEl = document.getElementById('admin-view-voice-category');
        const statusEl = document.getElementById('admin-view-voice-status');
        const textEl = document.getElementById('admin-view-voice-text');
        const nameEl = document.getElementById('admin-view-voice-name');
        const deptEl = document.getElementById('admin-view-voice-dept');
        const batchEl = document.getElementById('admin-view-voice-batch');
        const anonEl = document.getElementById('admin-view-voice-anon');
        const dateEl = document.getElementById('admin-view-voice-date');
        const actionsEl = document.getElementById('admin-view-voice-actions');

        if (idEl) idEl.innerText = `ID: ${voice.id}`;
        if (catEl) {
          catEl.className = `voice-category-badge ${getVoiceCategoryBadgeClass(voice.category)}`;
          catEl.innerText = voice.category || 'Campus Memory';
        }
        if (statusEl) {
          statusEl.innerText = voice.status ? voice.status.toUpperCase() : 'PENDING';
          statusEl.className = voice.status === 'approved' ? 'badge bg-success' : (voice.status === 'rejected' ? 'badge bg-danger' : 'badge bg-warning text-dark');
        }
        if (textEl) textEl.innerText = voice.text || '';
        if (nameEl) nameEl.innerText = voice.name || (voice.anonymous ? 'Anonymous Submitter' : 'Unknown');
        if (deptEl) deptEl.innerText = voice.department || '-';
        if (batchEl) batchEl.innerText = voice.batch || '-';
        if (anonEl) anonEl.innerText = voice.anonymous ? 'Yes (Name hidden publicly)' : 'No (Public author name)';
        if (dateEl) dateEl.innerText = formatVoiceDate(voice.createdAt);

        if (actionsEl) {
          actionsEl.innerHTML = `
            <button type="button" class="btn btn-secondary btn-sm px-4 rounded-pill" data-bs-dismiss="modal">Close</button>
            ${voice.status !== 'approved' ? `
              <button type="button" class="btn btn-success btn-sm px-4 rounded-pill fw-bold" id="modal-approve-voice-btn" data-id="${voice.id}">
                <i class="bi bi-check-circle-fill me-1"></i> Approve & Publish
              </button>
            ` : ''}
            ${voice.status !== 'rejected' ? `
              <button type="button" class="btn btn-warning btn-sm px-4 rounded-pill fw-bold" id="modal-reject-voice-btn" data-id="${voice.id}">
                <i class="bi bi-x-circle-fill me-1"></i> Reject
              </button>
            ` : ''}
          `;

          const modalApproveBtn = document.getElementById('modal-approve-voice-btn');
          if (modalApproveBtn) {
            modalApproveBtn.onclick = async () => {
              const modalEl = document.getElementById('viewVoiceModal');
              if (modalEl && typeof bootstrap !== 'undefined') {
                const inst = bootstrap.Modal.getInstance(modalEl);
                if (inst) inst.hide();
              }
              await executeAdminVoiceAction('approve', voice.id);
            };
          }

          const modalRejectBtn = document.getElementById('modal-reject-voice-btn');
          if (modalRejectBtn) {
            modalRejectBtn.onclick = async () => {
              const modalEl = document.getElementById('viewVoiceModal');
              if (modalEl && typeof bootstrap !== 'undefined') {
                const inst = bootstrap.Modal.getInstance(modalEl);
                if (inst) inst.hide();
              }
              await executeAdminVoiceAction('reject', voice.id);
            };
          }
        }

        const modalEl = document.getElementById('viewVoiceModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
          const inst = bootstrap.Modal.getOrCreateInstance(modalEl);
          inst.show();
        }
      };
    });

    tableBody.querySelectorAll('.admin-voice-approve-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        await executeAdminVoiceAction('approve', id);
      };
    });

    tableBody.querySelectorAll('.admin-voice-reject-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        await executeAdminVoiceAction('reject', id);
      };
    });

    tableBody.querySelectorAll('.admin-voice-feature-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const isCurFeatured = String(id) === String(featuredId);
        await executeAdminVoiceAction(isCurFeatured ? 'unfeature' : 'feature', id);
      };
    });

    tableBody.querySelectorAll('.admin-voice-delete-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const voice = allVoices.find(v => String(v.id) === String(id));
        pendingVoiceDeleteId = id;

        const previewEl = document.getElementById('delete-voice-preview-text');
        if (previewEl && voice) {
          previewEl.innerText = `"${voice.text.substring(0, 120)}${voice.text.length > 120 ? '...' : ''}" — ${voice.name || (voice.anonymous ? 'Anonymous' : 'Student')}`;
        }

        const modalEl = document.getElementById('deleteVoiceConfirmModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
          const inst = bootstrap.Modal.getOrCreateInstance(modalEl);
          inst.show();
        }
      };
    });
  }

  async function executeAdminVoiceAction(action, voiceId) {
    const adminSecret = await ensureAdminSecret();
    if (!adminSecret) return;

    showToast(`Processing voice ${action}...`, 'info');

    const resp = await manageVoiceOnServer({
      action,
      voiceId,
      adminSecret
    });

    if (!handleVoiceActionResponse(resp, `Failed to ${action} voice submission`)) {
      return;
    }

    if (resp.body && Array.isArray(resp.body.voices)) {
      window.__VOICES_GLOBAL = {
        voices: resp.body.voices,
        featuredVoiceId: resp.body.featuredVoiceId || null
      };
    }

    renderCampusVoices();
    renderAllVoicesModal();
    renderAdminVoicesManager();

    const actionLabels = {
      approve: 'Campus Voice approved and published!',
      reject: 'Campus Voice marked as rejected.',
      feature: 'Set as Featured Campus Voice on homepage!',
      unfeature: 'Removed from Featured status.',
      delete: 'Campus Voice permanently deleted.'
    };

    showToast(actionLabels[action] || `Voice ${action} completed successfully.`, 'success');
  }

  function bindCampusVoicesListeners() {
    // 1. Character counter on share voice textarea
    const voiceTextarea = document.getElementById('voiceSubmitText');
    const charCounter = document.getElementById('voice-char-count');
    if (voiceTextarea && charCounter) {
      voiceTextarea.oninput = () => {
        const len = voiceTextarea.value.length;
        charCounter.innerText = len;
        if (len > 400) {
          charCounter.classList.add('text-danger');
        } else {
          charCounter.classList.remove('text-danger');
        }
      };
    }

    // 2. Pre-fill user details on Share Voice Modal show
    const shareModalEl = document.getElementById('shareVoiceModal');
    if (shareModalEl) {
      shareModalEl.addEventListener('show.bs.modal', () => {
        const currentUser = getCurrentUser();
        const nameInput = document.getElementById('voiceSubmitName');
        const deptInput = document.getElementById('voiceSubmitDept');
        const userBanner = document.getElementById('voice-user-info-text');

        if (currentUser) {
          if (nameInput && !nameInput.value) nameInput.value = currentUser.name || '';
          if (deptInput && !deptInput.value) deptInput.value = currentUser.dept || '';
          if (userBanner) {
            userBanner.innerText = `Submitting as ${currentUser.name}. Your submission will be reviewed by campus moderators before going live.`;
          }
        }
      });
    }

    // 3. Share Voice Form Submission
    const shareForm = document.getElementById('share-voice-form');
    if (shareForm) {
      shareForm.onsubmit = async (e) => {
        e.preventDefault();

        const getVal = (id, def = '') => {
          const el = document.getElementById(id);
          return el ? el.value.trim() : def;
        };

        const text = getVal('voiceSubmitText');
        const category = getVal('voiceSubmitCategory', 'Campus Memory');
        const name = getVal('voiceSubmitName');
        const department = getVal('voiceSubmitDept');
        const batch = getVal('voiceSubmitBatch');
        const anonymous = !!document.getElementById('voiceSubmitAnonymous')?.checked;

        if (!text || text.length < 5) {
          showToast('Please enter a voice or thought (at least 5 characters).', 'warning');
          return;
        }

        const submitBtn = document.getElementById('submitVoiceBtn');
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';

        try {
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Submitting...`;
          }

          const currentUser = getCurrentUser();
          const payload = {
            text,
            category,
            name: name || (currentUser ? currentUser.name : 'Campus Student'),
            department: department || (currentUser ? currentUser.dept : 'Metropolitan University'),
            batch,
            anonymous,
            userId: currentUser ? currentUser.id : null,
            avatarUrl: currentUser ? currentUser.avatar : null
          };

          const resp = await submitCampusVoice(payload);

          if (resp && resp.ok && resp.body && resp.body.success) {
            showToast('🟢 Your Campus Voice has been submitted! It will appear publicly once approved by campus moderators.', 'success');

            shareForm.reset();
            if (charCounter) charCounter.innerText = '0';

            const modalInstance = (window.bootstrap && bootstrap.Modal)
              ? bootstrap.Modal.getInstance(shareModalEl)
              : null;
            if (modalInstance) modalInstance.hide();

            // Refresh authoritative global voices from storage immediately
            try {
              const freshVoices = await fetchAllCampusVoices();
              if (freshVoices && Array.isArray(freshVoices.voices)) {
                window.__VOICES_GLOBAL = {
                  voices: freshVoices.voices,
                  featuredVoiceId: freshVoices.featuredVoiceId || null
                };
                renderCampusVoices();
                renderAllVoicesModal();
                renderAdminVoicesManager();
              }
            } catch (fetchErr) {
              console.warn('[Post-submit voices refresh error]:', fetchErr);
            }
          } else {
            const err = (resp && resp.body && resp.body.error) || (resp && resp.error) || 'Failed to submit voice.';
            showToast(`🔴 ${err}`, 'danger');
          }
        } catch (err) {
          console.error('[Voice Submit Error]:', err);
          showToast(`🔴 Error: ${err.message || 'Submission failed'}`, 'danger');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
          }
        }
      };
    }

    // 4. All Voices Modal category filtering & share button
    const allVoicesModalEl = document.getElementById('allVoicesModal');
    if (allVoicesModalEl) {
      allVoicesModalEl.addEventListener('show.bs.modal', () => {
        renderAllVoicesModal();
      });

      allVoicesModalEl.querySelectorAll('.voice-modal-filter-btn').forEach(btn => {
        btn.onclick = () => {
          allVoicesModalEl.querySelectorAll('.voice-modal-filter-btn').forEach(b => {
            b.classList.remove('btn-primary', 'active');
            b.classList.add('btn-outline-secondary');
          });
          btn.classList.remove('btn-outline-secondary');
          btn.classList.add('btn-primary', 'active');

          allVoicesModalFilter = btn.getAttribute('data-category') || 'all';
          renderAllVoicesModal();
        };
      });

      const modalShareBtn = document.getElementById('all-voices-modal-share-btn');
      if (modalShareBtn) {
        modalShareBtn.onclick = () => {
          const allModalInst = (window.bootstrap && bootstrap.Modal)
            ? bootstrap.Modal.getInstance(allVoicesModalEl)
            : null;
          if (allModalInst) allModalInst.hide();

          const shareModalEl = document.getElementById('shareVoiceModal');
          if (shareModalEl && typeof bootstrap !== 'undefined') {
            const shareInst = bootstrap.Modal.getOrCreateInstance(shareModalEl);
            setTimeout(() => shareInst.show(), 250);
          }
        };
      }
    }

    // 5. Delete Voice confirmation modal confirm button
    const confirmDeleteBtn = document.getElementById('confirm-delete-voice-btn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.onclick = async () => {
        if (!pendingVoiceDeleteId) return;

        const deleteModalEl = document.getElementById('deleteVoiceConfirmModal');
        if (deleteModalEl && typeof bootstrap !== 'undefined') {
          const inst = bootstrap.Modal.getInstance(deleteModalEl);
          if (inst) inst.hide();
        }

        const idToDelete = pendingVoiceDeleteId;
        pendingVoiceDeleteId = null;
        await executeAdminVoiceAction('delete', idToDelete);
      };
    }
  }

  function bindAdminVoicesListeners() {
    // 1. Admin Voices filter buttons
    document.querySelectorAll('.admin-voices-filter-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.admin-voices-filter-btn').forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-outline-secondary');
        });
        btn.classList.remove('btn-outline-secondary');
        btn.classList.add('btn-primary');

        adminVoicesFilter = btn.getAttribute('data-filter') || 'all';
        renderAdminVoicesManager();
      };
    });

    // 2. Admin Voices search input
    const searchInput = document.getElementById('admin-voices-search-input');
    if (searchInput) {
      searchInput.oninput = () => {
        adminVoicesSearch = searchInput.value.trim();
        renderAdminVoicesManager();
      };
    }

    // 3. Admin Voices refresh button
    const refreshBtn = document.getElementById('admin-refresh-voices-btn');
    if (refreshBtn) {
      refreshBtn.onclick = async () => {
        showToast('Refreshing Campus Voices from server...', 'info');
        try {
          const freshData = await fetchAllCampusVoices();
          if (freshData && Array.isArray(freshData.voices)) {
            window.__VOICES_GLOBAL = {
              voices: freshData.voices,
              featuredVoiceId: freshData.featuredVoiceId || null
            };
            renderCampusVoices();
            renderAllVoicesModal();
            renderAdminVoicesManager();
            showToast('Campus Voices refreshed successfully.', 'success');
            return;
          }
        } catch (e) {}

        const adminSecret = await ensureAdminSecret();
        if (!adminSecret) return;

        const resp = await manageVoiceOnServer({
          action: 'get_admin',
          adminSecret
        });

        if (!handleVoiceActionResponse(resp, 'Failed to fetch admin voices')) {
          return;
        }

        if (resp.body && Array.isArray(resp.body.voices)) {
          window.__VOICES_GLOBAL = {
            voices: resp.body.voices,
            featuredVoiceId: resp.body.featuredVoiceId || null
          };
        }

        renderCampusVoices();
        renderAllVoicesModal();
        renderAdminVoicesManager();
        showToast('Campus Voices refreshed successfully.', 'success');
      };
    }
  }

  // Render Photo of the Week Section dynamically (uses global POTW loaded from Supabase storage)
  function renderPOTWSection() {
    const container = document.getElementById('potw-card-container');
    if (!container) return;

    const potw = window.__POTW_GLOBAL || null;

    if (!potw) {
      container.innerHTML = `<div class="glass-panel potw-card d-flex align-items-center justify-content-center" style="min-height:260px;"><div class="text-muted">No Photo of the Week selected.</div></div>`;
      return;
    }

    container.innerHTML = `
      <div class="row g-0 align-items-center">
        <div class="col-lg-7">
          <div class="potw-img-wrapper position-relative overflow-hidden">
            <span class="potw-badge"><i class="bi bi-award-fill me-1"></i> ${potw.badgeLabel || 'Winner • Photo Of The Week'}</span>
            <img src="${normalizeImgUrl(potw.imageUrl)}" alt="${potw.title}" class="potw-img w-100 object-fit-cover" style="max-height: 480px;" loading="lazy">
          </div>
        </div>
        <div class="col-lg-5 p-4 p-lg-5">
          <div class="d-flex align-items-center gap-2 mb-3 text-muted small">
            <span><i class="bi bi-geo-alt-fill text-danger me-1"></i> ${potw.location || 'Campus Quad'}</span>
            <span>•</span>
            <span><i class="bi bi-clock me-1"></i> ${potw.date || 'Weekly Spotlight'}</span>
          </div>
          <h3 class="font-heading fs-2 mb-3">${potw.title}</h3>
          <p class="text-muted mb-4 font-serif fst-italic">
            "${potw.description}"
          </p>

          <div class="bg-body-secondary p-3 rounded-3 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2 text-muted extra-small">
            <span><i class="bi bi-camera"></i> Sony A7 IV</span>
            <span><i class="bi bi-disc"></i> 35mm f/1.4</span>
            <span><i class="bi bi-speedometer2"></i> 1/500s</span>
            <span><i class="bi bi-sun"></i> ISO 100</span>
          </div>

          <div class="d-flex align-items-center justify-content-between pt-3 border-top">
            <div class="d-flex align-items-center gap-3">
              <img src="${potw.author ? potw.author.avatarUrl : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'}" alt="${potw.author ? potw.author.name : 'Photographer'}" class="author-avatar" style="width: 46px; height: 46px;">
              <div>
                <div class="fw-bold">${potw.author ? potw.author.name : 'Featured Creator'}</div>
                <div class="text-muted small">${potw.author ? potw.author.role : 'Campus Photographer'}</div>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-outline-danger btn-sm rounded-circle p-2 like-btn-trigger" aria-label="Like" title="Like photo">
                <i class="bi bi-heart fs-6"></i>
              </button>
              <button class="btn btn-outline-primary btn-sm rounded-circle p-2" title="Share Photo" onclick="sharePOTW()" aria-label="Share">
                <i class="bi bi-share-fill fs-6"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Helper function to delete memory album
  async function deleteMemoryItem(memId) {
    if (!memId) return;

    const currentUser = getCurrentUser();
    if (!currentUser) {
      showToast('Please sign in to delete campus memories.', 'warning');
      return;
    }

    const memIdStr = String(memId);
    let allMemories = getAllMemoriesCombined();
    const memToDelete = allMemories.find(m => String(m.id) === memIdStr || m.id === memId);

    if (memToDelete && !canDeleteMemory(memToDelete)) {
      showToast('Permission Denied: You can only delete your own uploaded items.', 'danger');
      return;
    }

    // 1. Remove from Supabase Cloud DB & Storage bucket
    await deleteMemoryFromSupabase(memIdStr);

    // 2. Remove from IndexedDB
    await imageStoreDB.deleteMemory(memIdStr);

    // 2. Add to campuslens_deleted_memories in localStorage
    let deletedIds = JSON.parse(localStorage.getItem('campuslens_deleted_memories') || '[]');
    if (!deletedIds.includes(memId)) deletedIds.push(memId);
    if (!deletedIds.includes(memIdStr)) deletedIds.push(memIdStr);
    localStorage.setItem('campuslens_deleted_memories', JSON.stringify(deletedIds));

    // 3. Remove from MULensData.FEATURED_MEMORIES in memory
    if (MULensData && Array.isArray(MULensData.FEATURED_MEMORIES)) {
      for (let i = MULensData.FEATURED_MEMORIES.length - 1; i >= 0; i--) {
        const m = MULensData.FEATURED_MEMORIES[i];
        if (String(m.id) === memIdStr || m.id === memId) {
          MULensData.FEATURED_MEMORIES.splice(i, 1);
        }
      }
    }

    // 4. Remove from modifiedMemoriesMap in localStorage if present
    let modifiedMap = JSON.parse(localStorage.getItem('campuslens_modified_memories') || '{}');
    if (modifiedMap[memId] || modifiedMap[memIdStr]) {
      delete modifiedMap[memId];
      delete modifiedMap[memIdStr];
      localStorage.setItem('campuslens_modified_memories', JSON.stringify(modifiedMap));
    }

    // 5. Remove from user albums and favorites across all local accounts
    const allUsers = getUsers();
    allUsers.forEach(u => {
      const favs = getUserFavorites(u.id);
      const updatedFavs = favs.filter(f => String(f.id) !== memIdStr && f.id !== memId);
      if (updatedFavs.length !== favs.length) setUserFavorites(u.id, updatedFavs);

      const albums = getUserAlbums(u.id);
      const updatedAlbums = albums.filter(a => String(a.id) !== memIdStr && a.id !== memId && a.title !== (memToDelete ? memToDelete.title : ''));
      if (updatedAlbums.length !== albums.length) setUserAlbums(u.id, updatedAlbums);
    });

    // 6. If deleted memory was the current POTW, re-fetch global POTW from server (do not use localStorage)
    try {
      const potw = await fetchPOTWFromSupabase();
      window.__POTW_GLOBAL = potw || null;
    } catch (e) {
      window.__POTW_GLOBAL = null;
    }

    showToast('Memory album deleted successfully!', 'info');

    // 7. Re-render UI views immediately
    renderDynamicDataFromDataTS();
    renderProfileView();
    renderDashboardView();
    renderPOTWSection();

    const adminPage = document.getElementById('page-admin');
    if (adminPage && !adminPage.classList.contains('d-none')) {
      renderAdminSpaceView();
    }
  }

  // Global state for active Lightbox album viewer
  let currentActiveAlbumImages = [];
  let currentActiveAlbumIndex = 0;
  let currentActiveMemoryId = null;

  // Custom Delete Confirmation Modal Logic (replaces window.confirm)
  let pendingDeleteAction = null;

  function showCustomDeleteModal(onConfirmCallback, customMessage) {
    pendingDeleteAction = onConfirmCallback;
    const msgEl = document.getElementById('deleteConfirmModalMessage');
    if (msgEl) {
      msgEl.innerText = customMessage || "Are you sure you want to delete this item? This action cannot be undone.";
    }
    const modalEl = document.getElementById('deleteConfirmModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.show();
    }
  }

  // Bind Confirm Delete Button in Modal
  const modalConfirmDeleteBtn = document.getElementById('deleteConfirmModalConfirmBtn');
  if (modalConfirmDeleteBtn) {
    modalConfirmDeleteBtn.onclick = () => {
      const modalEl = document.getElementById('deleteConfirmModal');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
      }
      if (typeof pendingDeleteAction === 'function') {
        const action = pendingDeleteAction;
        pendingDeleteAction = null;
        action();
      }
    };
  }

  function formatRatioDisplay(w, h) {
    if (!w || !h) return 'Original Ratio';
    const r = w / h;
    let label = 'Original';
    if (Math.abs(r - 16 / 9) < 0.08) label = '16:9 Landscape';
    else if (Math.abs(r - 4 / 3) < 0.08) label = '4:3 Standard';
    else if (Math.abs(r - 3 / 2) < 0.08) label = '3:2 DSLR';
    else if (Math.abs(r - 1.0) < 0.08) label = '1:1 Square';
    else if (Math.abs(r - 4 / 5) < 0.08) label = '4:5 Instagram Portrait';
    else if (Math.abs(r - 3 / 4) < 0.08) label = '3:4 Vertical';
    else if (Math.abs(r - 9 / 16) < 0.08) label = '9:16 Mobile Story';
    else label = r > 1 ? `${r.toFixed(2)}:1 Landscape` : `1:${(1 / r).toFixed(2)} Portrait`;

    return `${w}×${h} • ${label}`;
  }

  function updateImageAspectRatioMatching(imgElement) {
    if (!imgElement) return;
    const w = imgElement.naturalWidth;
    const h = imgElement.naturalHeight;
    if (w && h) {
      const ratioStr = formatRatioDisplay(w, h);
      const aspectStyle = `${w} / ${h}`;

      const modalAspectRatioText = document.getElementById('modalAspectRatioText');
      if (modalAspectRatioText) modalAspectRatioText.innerText = ratioStr;

      const fsOverlayRatioBadge = document.getElementById('fsOverlayRatioBadge');
      if (fsOverlayRatioBadge) fsOverlayRatioBadge.innerHTML = `<i class="bi bi-aspect-ratio me-1"></i> ${ratioStr}`;

      imgElement.style.aspectRatio = aspectStyle;

      const photoViewerWrapper = document.getElementById('photoViewerWrapper');
      if (photoViewerWrapper) {
        photoViewerWrapper.style.aspectRatio = aspectStyle;
      }
    }
  }

  // Fullscreen Photo Overlay Handlers
  function openFullscreenPhotoViewer() {
    const fsOverlay = document.getElementById('fullscreenPhotoOverlay');
    const fsImg = document.getElementById('fsOverlayImg');
    const fsTitle = document.getElementById('fsOverlayTitle');
    const fsCounter = document.getElementById('fsOverlayCounter');
    const fsAuthorText = document.getElementById('fsOverlayAuthorText');
    const fsLocationText = document.getElementById('fsOverlayLocationText');
    const fsPrevBtn = document.getElementById('fsOverlayPrevBtn');
    const fsNextBtn = document.getElementById('fsOverlayNextBtn');
    const fsThumbsRibbon = document.getElementById('fsOverlayThumbsRibbon');

    if (!fsOverlay || !currentActiveAlbumImages.length) return;

    const currentImgUrl = currentActiveAlbumImages[currentActiveAlbumIndex] || '';

    const modalTitle = document.getElementById('modalPhotoTitle')?.innerText || 'Campus Memory';
    const modalAuthor = document.getElementById('modalPhotoAuthor')?.innerText || 'Photographer';
    const modalLocation = document.getElementById('modalPhotoLocation')?.innerText || 'Main Campus';

    if (fsTitle) fsTitle.innerText = modalTitle;
    if (fsAuthorText) fsAuthorText.innerText = modalAuthor;
    if (fsLocationText) fsLocationText.innerText = modalLocation;
    if (fsCounter) fsCounter.innerText = `${currentActiveAlbumIndex + 1} / ${currentActiveAlbumImages.length}`;

    if (fsImg) {
      fsImg.style.opacity = '0.3';
      fsImg.src = currentImgUrl;
      fsImg.onload = () => {
        fsImg.style.opacity = '1';
        updateImageAspectRatioMatching(fsImg);
      };
    }

    if (currentActiveAlbumImages.length > 1) {
      if (fsPrevBtn) fsPrevBtn.classList.remove('d-none');
      if (fsNextBtn) fsNextBtn.classList.remove('d-none');
      if (fsThumbsRibbon) {
        fsThumbsRibbon.innerHTML = currentActiveAlbumImages.map((src, idx) => `
          <img src="${src}" class="album-thumb-item rounded-2 border cursor-pointer transition-all ${idx === currentActiveAlbumIndex ? 'border-primary border-3 scale-105 opacity-100 shadow' : 'opacity-60 hover-opacity-100'}" 
               style="width: 52px; height: 52px; object-fit: cover;" 
               data-index="${idx}" 
               alt="Thumb ${idx + 1}">
        `).join('');

        fsThumbsRibbon.querySelectorAll('.album-thumb-item').forEach(thumb => {
          thumb.onclick = (e) => {
            e.stopPropagation();
            const idx = parseInt(thumb.getAttribute('data-index') || '0', 10);
            updateLightboxImageIndex(idx);
            openFullscreenPhotoViewer();
          };
        });
      }
    } else {
      if (fsPrevBtn) fsPrevBtn.classList.add('d-none');
      if (fsNextBtn) fsNextBtn.classList.add('d-none');
      if (fsThumbsRibbon) fsThumbsRibbon.innerHTML = '';
    }

    fsOverlay.classList.remove('d-none');
    fsOverlay.classList.add('d-flex');

    // Attempt browser native requestFullscreen
    if (fsOverlay.requestFullscreen && !document.fullscreenElement) {
      fsOverlay.requestFullscreen().catch(err => {
        console.log('Browser requestFullscreen non-fatal:', err);
      });
    }
  }

  function closeFullscreenPhotoViewer() {
    const fsOverlay = document.getElementById('fullscreenPhotoOverlay');
    if (fsOverlay) {
      fsOverlay.classList.add('d-none');
      fsOverlay.classList.remove('d-flex');
    }
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(err => {
        console.log('Browser exitFullscreen non-fatal:', err);
      });
    }
  }

  function openMemoryInLightbox(memObj) {
    if (!memObj) return;

    currentActiveMemoryId = memObj.id;

    let albumImages = [memObj.imageUrl];
    if (Array.isArray(memObj.albumImages) && memObj.albumImages.length > 0) {
      albumImages = memObj.albumImages;
    }

    currentActiveAlbumImages = albumImages;
    currentActiveAlbumIndex = 0;

    const modalTitle = document.getElementById('modalPhotoTitle');
    const modalAuthor = document.getElementById('modalPhotoAuthor');
    const modalAuthorRole = document.getElementById('modalPhotoAuthorRole');
    const modalAuthorAvatar = document.getElementById('modalPhotoAuthorAvatar');
    const modalLocation = document.getElementById('modalPhotoLocation');
    const modalDate = document.getElementById('modalPhotoDate');
    const modalTag = document.getElementById('modalPhotoTag');
    const modalDesc = document.getElementById('modalPhotoDesc');
    const deletePhotoBtn = document.getElementById('modalDeletePhotoBtn');
    const deleteAlbumBtn = document.getElementById('modalDeleteAlbumBtn');

    if (modalTitle) modalTitle.innerText = memObj.title || 'Campus Memory';
    if (modalAuthor) modalAuthor.innerText = memObj.author ? memObj.author.name : 'Student Photographer';
    if (modalAuthorRole) modalAuthorRole.innerText = memObj.author ? (memObj.author.role || 'MULens Creator') : 'MULens Creator';
    if (modalAuthorAvatar) modalAuthorAvatar.src = memObj.author ? (memObj.author.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150') : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150';
    if (modalLocation) modalLocation.innerText = memObj.location || 'Main Campus';
    if (modalDate) modalDate.innerText = memObj.date || 'Spring 2026';
    if (modalTag) modalTag.innerText = `#${memObj.badgeLabel || memObj.category || 'Gallery'}`;
    if (modalDesc) modalDesc.innerText = memObj.description || memObj.title || '';

    const userCanDelete = canDeleteMemory(memObj);

    if (deleteAlbumBtn) {
      if (userCanDelete) deleteAlbumBtn.classList.remove('d-none');
      else deleteAlbumBtn.classList.add('d-none');
    }
    if (deletePhotoBtn) {
      if (userCanDelete) deletePhotoBtn.classList.remove('d-none');
      else deletePhotoBtn.classList.add('d-none');
    }

    renderLightboxAlbumHeaderAndThumbs();
    updateLightboxImageIndex(0);

    const photoModalEl = document.getElementById('photoModal');
    if (photoModalEl && typeof bootstrap !== 'undefined') {
      const photoModal = bootstrap.Modal.getOrCreateInstance(photoModalEl);
      photoModal.show();
    }
  }

  // Bind Photo & Album Lightbox Modal
  function bindMemoryCardClickListeners() {
    const memoryCards = document.querySelectorAll('.memory-card-trigger');
    memoryCards.forEach(card => {
      card.onclick = (e) => {
        if (e && e.target && (e.target.closest('.delete-memory-trigger') || e.target.closest('.like-btn-trigger'))) {
          return;
        }
        const memId = card.getAttribute('data-id') || '';
        const title = card.getAttribute('data-title') || 'Campus Memory';
        const imgUrl = card.getAttribute('data-img') || '';
        const author = card.getAttribute('data-author') || 'Student Photographer';
        const authorRole = card.getAttribute('data-author-role') || 'MULens Creator';
        const authorAvatar = card.getAttribute('data-author-avatar') || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150';
        const location = card.getAttribute('data-location') || 'Main Campus';
        const date = card.getAttribute('data-date') || 'Spring 2026';
        const tag = card.getAttribute('data-tag') || 'Gallery';
        const desc = card.getAttribute('data-desc') || title;
        const albumRaw = card.getAttribute('data-album');
        const userId = card.getAttribute('data-userid') || null;

        let parsedAlbum = null;
        if (albumRaw) {
          try {
            parsedAlbum = JSON.parse(decodeURIComponent(albumRaw));
          } catch (err) {
            console.error('Error parsing album JSON:', err);
          }
        }

        const customMemories = imageStoreDB.cachedMemories || [];
        const baseMemories = (MULensData && Array.isArray(MULensData.FEATURED_MEMORIES)) ? MULensData.FEATURED_MEMORIES : [];
        let activeMemObj = [...customMemories, ...baseMemories].find(m => String(m.id) === String(memId));

        if (!activeMemObj) {
          activeMemObj = {
            id: memId,
            title: title,
            imageUrl: imgUrl,
            albumImages: Array.isArray(parsedAlbum) && parsedAlbum.length > 0 ? parsedAlbum : [imgUrl],
            author: { name: author, role: authorRole, avatarUrl: authorAvatar },
            location: location,
            date: date,
            badgeLabel: tag,
            description: desc,
            userId: userId
          };
        } else if (Array.isArray(parsedAlbum) && parsedAlbum.length > 0 && (!activeMemObj.albumImages || activeMemObj.albumImages.length <= 1)) {
          activeMemObj.albumImages = parsedAlbum;
        }

        openMemoryInLightbox(activeMemObj);
      };
    });

    // Bind Fullscreen buttons in Modal and Overlay
    const modalFullscreenBtn = document.getElementById('modalFullscreenBtn');
    const modalQuickFullscreenBtn = document.getElementById('modalQuickFullscreenBtn');
    const modalPhotoImg = document.getElementById('modalPhotoImg');
    const fsOverlayCloseBtn = document.getElementById('fsOverlayCloseBtn');
    const fsOverlayPrevBtn = document.getElementById('fsOverlayPrevBtn');
    const fsOverlayNextBtn = document.getElementById('fsOverlayNextBtn');
    const fsOverlayFitToggle = document.getElementById('fsOverlayFitToggle');

    if (modalFullscreenBtn) modalFullscreenBtn.onclick = (e) => { e.stopPropagation(); openFullscreenPhotoViewer(); };
    if (modalQuickFullscreenBtn) modalQuickFullscreenBtn.onclick = (e) => { e.stopPropagation(); openFullscreenPhotoViewer(); };
    if (modalPhotoImg) modalPhotoImg.ondblclick = (e) => { e.stopPropagation(); openFullscreenPhotoViewer(); };

    if (fsOverlayCloseBtn) fsOverlayCloseBtn.onclick = (e) => { e.stopPropagation(); closeFullscreenPhotoViewer(); };
    if (fsOverlayPrevBtn) {
      fsOverlayPrevBtn.onclick = (e) => {
        e.stopPropagation();
        if (currentActiveAlbumImages.length <= 1) return;
        const newIdx = (currentActiveAlbumIndex - 1 + currentActiveAlbumImages.length) % currentActiveAlbumImages.length;
        updateLightboxImageIndex(newIdx);
        openFullscreenPhotoViewer();
      };
    }
    if (fsOverlayNextBtn) {
      fsOverlayNextBtn.onclick = (e) => {
        e.stopPropagation();
        if (currentActiveAlbumImages.length <= 1) return;
        const newIdx = (currentActiveAlbumIndex + 1) % currentActiveAlbumImages.length;
        updateLightboxImageIndex(newIdx);
        openFullscreenPhotoViewer();
      };
    }
    if (fsOverlayFitToggle) {
      fsOverlayFitToggle.onclick = (e) => {
        e.stopPropagation();
        const fsImg = document.getElementById('fsOverlayImg');
        const fitText = document.getElementById('fsOverlayFitText');
        if (fsImg) {
          if (fsImg.classList.contains('aspect-fill-cover')) {
            fsImg.classList.remove('aspect-fill-cover');
            fsImg.classList.add('aspect-fit-contain');
            if (fitText) fitText.innerText = 'Fit Original Ratio';
          } else {
            fsImg.classList.remove('aspect-fit-contain');
            fsImg.classList.add('aspect-fill-cover');
            if (fitText) fitText.innerText = 'Fill Stage';
          }
        }
      };
    }

    // Modal Download button listener
    const downloadBtn = document.getElementById('modalDownloadBtn');
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        const currentImg = currentActiveAlbumImages[currentActiveAlbumIndex] || '';
        const title = document.getElementById('modalPhotoTitle')?.innerText || 'Photo';
        const a = document.createElement('a');
        a.href = currentImg;
        a.download = `${title.replace(/\s+/g, '_')}_photo_${currentActiveAlbumIndex + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('High-resolution photo download triggered!', 'success');
      };
    }

    // Modal Delete Entire Album Button Listener
    const deleteAlbumBtn = document.getElementById('modalDeleteAlbumBtn');
    if (deleteAlbumBtn) {
      deleteAlbumBtn.onclick = () => {
        showCustomDeleteModal(() => {
          const photoModalEl = document.getElementById('photoModal');
          if (photoModalEl && typeof bootstrap !== 'undefined') {
            const photoModal = bootstrap.Modal.getInstance(photoModalEl);
            if (photoModal) photoModal.hide();
          }
          deleteMemoryItem(currentActiveMemoryId);
        });
      };
    }

    // Modal Delete Specific Photo Button Listener
    const deletePhotoBtn = document.getElementById('modalDeletePhotoBtn');
    if (deletePhotoBtn) {
      deletePhotoBtn.onclick = () => {
        if (currentActiveAlbumImages.length <= 1) {
          showCustomDeleteModal(() => {
            const photoModalEl = document.getElementById('photoModal');
            if (photoModalEl && typeof bootstrap !== 'undefined') {
              const photoModal = bootstrap.Modal.getInstance(photoModalEl);
              if (photoModal) photoModal.hide();
            }
            deleteMemoryItem(currentActiveMemoryId);
          });
        } else {
          showCustomDeleteModal(() => {
            currentActiveAlbumImages.splice(currentActiveAlbumIndex, 1);
            currentActiveAlbumIndex = Math.min(currentActiveAlbumIndex, currentActiveAlbumImages.length - 1);

            let customMemoriesList = imageStoreDB.cachedMemories || [];
            let customIndex = customMemoriesList.findIndex(m => String(m.id) === String(currentActiveMemoryId));
            if (customIndex !== -1) {
              const targetMem = customMemoriesList[customIndex];
              targetMem.albumImages = [...currentActiveAlbumImages];
              targetMem.imageUrl = currentActiveAlbumImages[0];
              if (Array.isArray(targetMem.imageKeys)) {
                targetMem.imageKeys = targetMem.imageKeys.filter((_, idx) => idx !== currentActiveAlbumIndex);
              }
              imageStoreDB.saveMemory(targetMem);
            } else {
              let modifiedMap = JSON.parse(localStorage.getItem('campuslens_modified_memories') || '{}');
              modifiedMap[currentActiveMemoryId] = {
                albumImages: [...currentActiveAlbumImages],
                imageUrl: currentActiveAlbumImages[0]
              };
              localStorage.setItem('campuslens_modified_memories', JSON.stringify(modifiedMap));
            }

            renderLightboxAlbumHeaderAndThumbs();
            updateLightboxImageIndex(currentActiveAlbumIndex);
            showToast('Selected photo removed from album!', 'success');

            renderDynamicDataFromDataTS();
          });
        }
      };
    }

    // Bind card delete buttons across gallery grids
    document.querySelectorAll('.delete-memory-trigger').forEach(deleteBtn => {
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const card = deleteBtn.closest('.memory-card-trigger');
        const memId = deleteBtn.getAttribute('data-id') || (card ? card.getAttribute('data-id') : null);
        if (!memId) return;
        showCustomDeleteModal(() => {
          deleteMemoryItem(memId);
        });
      };
    });

    // Album Prev / Next Click Handlers
    const albumPrevBtn = document.getElementById('albumPrevBtn');
    const albumNextBtn = document.getElementById('albumNextBtn');

    if (albumPrevBtn) {
      albumPrevBtn.onclick = (e) => {
        e.stopPropagation();
        if (currentActiveAlbumImages.length <= 1) return;
        const newIdx = (currentActiveAlbumIndex - 1 + currentActiveAlbumImages.length) % currentActiveAlbumImages.length;
        updateLightboxImageIndex(newIdx);
      };
    }

    if (albumNextBtn) {
      albumNextBtn.onclick = (e) => {
        e.stopPropagation();
        if (currentActiveAlbumImages.length <= 1) return;
        const newIdx = (currentActiveAlbumIndex + 1) % currentActiveAlbumImages.length;
        updateLightboxImageIndex(newIdx);
      };
    }

    // Keyboard Arrow Navigation & Fullscreen Shortcuts
    window.onkeydown = (e) => {
      const photoModalEl = document.getElementById('photoModal');
      const fsOverlay = document.getElementById('fullscreenPhotoOverlay');

      const isModalOpen = photoModalEl && photoModalEl.classList.contains('show');
      const isOverlayOpen = fsOverlay && !fsOverlay.classList.contains('d-none');

      if (isModalOpen || isOverlayOpen) {
        if (e.key === 'f' || e.key === 'F') {
          if (isOverlayOpen) closeFullscreenPhotoViewer();
          else openFullscreenPhotoViewer();
        } else if (e.key === 'Escape') {
          if (isOverlayOpen) closeFullscreenPhotoViewer();
        } else if (e.key === 'ArrowLeft' && currentActiveAlbumImages.length > 1) {
          const newIdx = (currentActiveAlbumIndex - 1 + currentActiveAlbumImages.length) % currentActiveAlbumImages.length;
          updateLightboxImageIndex(newIdx);
        } else if (e.key === 'ArrowRight' && currentActiveAlbumImages.length > 1) {
          const newIdx = (currentActiveAlbumIndex + 1) % currentActiveAlbumImages.length;
          updateLightboxImageIndex(newIdx);
        }
      }
    };

    // Bind Like Buttons
    document.querySelectorAll('.like-btn-trigger').forEach(likeBtn => {
      likeBtn.onclick = (e) => {
        e.stopPropagation();
        const heartIcon = likeBtn.querySelector('i');
        const card = likeBtn.closest('.memory-card');
        const countSpan = card ? card.querySelector('.like-count') : null;
        let count = countSpan ? parseInt(countSpan.innerText) || 0 : 0;

        if (likeBtn.classList.contains('liked')) {
          likeBtn.classList.remove('liked');
          if (heartIcon) heartIcon.className = 'bi bi-heart';
          count = Math.max(0, count - 1);
          showToast('Unliked photo', 'info');
        } else {
          likeBtn.classList.add('liked');
          if (heartIcon) heartIcon.className = 'bi bi-heart-fill text-danger';
          count += 1;
          showToast('Liked photo!', 'danger');
        }
        if (countSpan) countSpan.innerText = count;
      };
    });
  }

  // Render Lightbox Album Header Badge & Thumbnail ribbon
  function renderLightboxAlbumHeaderAndThumbs() {
    const modalAlbumBadge = document.getElementById('modalAlbumBadge');
    const albumControlsHeader = document.getElementById('albumControlsHeader');
    const albumPrevBtn = document.getElementById('albumPrevBtn');
    const albumNextBtn = document.getElementById('albumNextBtn');
    const albumThumbsContainer = document.getElementById('albumThumbsContainer');
    const albumThumbsRibbon = document.getElementById('albumThumbsRibbon');

    if (currentActiveAlbumImages.length > 1) {
      if (modalAlbumBadge) {
        modalAlbumBadge.innerText = `Album • ${currentActiveAlbumImages.length} Photos`;
        modalAlbumBadge.classList.remove('d-none');
      }
      if (albumControlsHeader) albumControlsHeader.classList.remove('d-none');
      if (albumPrevBtn) albumPrevBtn.classList.remove('d-none');
      if (albumNextBtn) albumNextBtn.classList.remove('d-none');
      if (albumThumbsContainer) albumThumbsContainer.classList.remove('d-none');

      if (albumThumbsRibbon) {
        albumThumbsRibbon.innerHTML = currentActiveAlbumImages.map((src, idx) => `
          <img src="${src}" class="album-thumb-item rounded-2 border cursor-pointer transition-all ${idx === currentActiveAlbumIndex ? 'border-primary border-3 scale-105' : 'opacity-60 hover-opacity-100'}" 
               style="width: 54px; height: 54px; object-fit: cover;" 
               data-index="${idx}" 
               alt="Thumb ${idx + 1}">
        `).join('');

        albumThumbsRibbon.querySelectorAll('.album-thumb-item').forEach(thumb => {
          thumb.onclick = (e) => {
            e.stopPropagation();
            const idx = parseInt(thumb.getAttribute('data-index') || '0', 10);
            updateLightboxImageIndex(idx);
          };
        });
      }
    } else {
      if (modalAlbumBadge) modalAlbumBadge.classList.add('d-none');
      if (albumControlsHeader) albumControlsHeader.classList.add('d-none');
      if (albumPrevBtn) albumPrevBtn.classList.add('d-none');
      if (albumNextBtn) albumNextBtn.classList.add('d-none');
      if (albumThumbsContainer) albumThumbsContainer.classList.add('d-none');
    }
  }

  // Update active image inside lightbox
  function updateLightboxImageIndex(index) {
    if (!currentActiveAlbumImages.length) return;
    currentActiveAlbumIndex = Math.max(0, Math.min(index, currentActiveAlbumImages.length - 1));

    const modalImg = document.getElementById('modalPhotoImg');
    const albumCounterText = document.getElementById('albumCounterText');

    if (modalImg) {
      modalImg.style.opacity = '0.3';
      modalImg.src = currentActiveAlbumImages[currentActiveAlbumIndex];
      modalImg.onload = () => {
        modalImg.style.opacity = '1';
        updateImageAspectRatioMatching(modalImg);
      };
    }

    if (albumCounterText) {
      albumCounterText.innerText = `Photo ${currentActiveAlbumIndex + 1} of ${currentActiveAlbumImages.length}`;
    }

    // Highlight active thumbnail
    const albumThumbsRibbon = document.getElementById('albumThumbsRibbon');
    if (albumThumbsRibbon) {
      albumThumbsRibbon.querySelectorAll('.album-thumb-item').forEach((thumb, idx) => {
        if (idx === currentActiveAlbumIndex) {
          thumb.className = 'album-thumb-item rounded-2 border border-primary border-3 cursor-pointer transition-all scale-105 opacity-100 shadow';
        } else {
          thumb.className = 'album-thumb-item rounded-2 border cursor-pointer transition-all opacity-60 hover-opacity-100';
        }
      });
    }

    // Also update fullscreen overlay if active
    const fsOverlay = document.getElementById('fullscreenPhotoOverlay');
    if (fsOverlay && !fsOverlay.classList.contains('d-none')) {
      const fsImg = document.getElementById('fsOverlayImg');
      const fsCounter = document.getElementById('fsOverlayCounter');
      if (fsCounter) fsCounter.innerText = `${currentActiveAlbumIndex + 1} / ${currentActiveAlbumImages.length}`;
      if (fsImg) {
        fsImg.style.opacity = '0.3';
        fsImg.src = currentActiveAlbumImages[currentActiveAlbumIndex];
        fsImg.onload = () => {
          fsImg.style.opacity = '1';
          updateImageAspectRatioMatching(fsImg);
        };
      }
    }
  }

  // Bind Gallery Category Filters (Dynamic DOM query)
  function bindGalleryFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Clear search input on category filter click
        const searchInput = document.getElementById('hero-search-input');
        if (searchInput) searchInput.value = '';

        renderDynamicDataFromDataTS();
      };
    });
  }

  // Bind Hero Search (Dynamic DOM query)
  function bindHeroSearch() {
    const heroSearchBtn = document.getElementById('hero-search-btn');
    if (heroSearchBtn) {
      heroSearchBtn.onclick = (e) => {
        e.preventDefault();
        const searchInputVal = document.getElementById('hero-search-input')?.value.trim().toLowerCase();
        const categoryVal = document.getElementById('search-event')?.value;

        if (categoryVal) {
          const filterBtns = document.querySelectorAll('.filter-btn');
          filterBtns.forEach(b => b.classList.remove('active'));
          const matchingFilter = document.querySelector(`.filter-btn[data-filter="${categoryVal}"]`);
          if (matchingFilter) {
            matchingFilter.classList.add('active');
          }
        }

        renderDynamicDataFromDataTS();

        showToast(`Searching memories for: "${searchInputVal || categoryVal || 'All Memories'}"`, 'primary');

        const gallerySection = document.getElementById('featured-memories');
        if (gallerySection) gallerySection.scrollIntoView({ behavior: 'smooth' });
      };
    }
  }

  // Execute Initial Dynamic Rendering & Bindings
  renderDynamicDataFromDataTS();

  // Hero Background Crossfade Loop
  let currentHeroSlideIndex = 0;
  setInterval(() => {
    const heroSlides = document.querySelectorAll('.hero-bg-slider .hero-bg-slide');
    if (heroSlides.length > 0) {
      let activeIdx = -1;
      heroSlides.forEach((slide, idx) => {
        if (slide.classList.contains('active')) {
          activeIdx = idx;
        }
      });

      if (activeIdx !== -1) {
        currentHeroSlideIndex = activeIdx;
      }

      heroSlides[currentHeroSlideIndex].classList.remove('active');
      currentHeroSlideIndex = (currentHeroSlideIndex + 1) % heroSlides.length;
      heroSlides[currentHeroSlideIndex].classList.add('active');
    }
  }, 5000);

  // Bind Quick Trending Tag Buttons
  const quickTagBtns = document.querySelectorAll('.quick-tag-btn');
  quickTagBtns.forEach(tagBtn => {
    tagBtn.addEventListener('click', () => {
      const tag = (tagBtn.getAttribute('data-tag') || '').toLowerCase();
      
      const matchingFilter = document.querySelector(`.filter-btn[data-filter="${tagBtn.getAttribute('data-tag')}"]`);
      if (matchingFilter) {
        matchingFilter.click();
      } else {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const memoryItems = document.querySelectorAll('.memory-item');
        filterBtns.forEach(b => b.classList.remove('active'));
        
        let foundCount = 0;
        memoryItems.forEach(item => {
          const category = (item.getAttribute('data-category') || '').toLowerCase();
          const searchHaystack = (item.getAttribute('data-search') || '').toLowerCase();
          if (category === tag || searchHaystack.includes(tag)) {
            item.style.display = 'inline-block';
            item.style.animation = 'fadeInUp 0.5s ease forwards';
            foundCount++;
          } else {
            item.style.display = 'none';
          }
        });

        if (foundCount === 0) {
          memoryItems.forEach(item => { item.style.display = 'inline-block'; });
        }
      }

      const gallerySection = document.getElementById('featured-memories');
      if (gallerySection) gallerySection.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Newsletter Submission
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletter-email');
      if (emailInput && emailInput.value) {
        showToast('Thank you for subscribing to MULens Digest!', 'success');
        emailInput.value = '';
      }
    });
  }

  // --------------------------------------------------------------------------
  // SPA Hash Routing & View Management
  // --------------------------------------------------------------------------
  function updateNavbarActiveLinks(hash, targetPageId) {
    const allNavLinks = document.querySelectorAll('.navbar-custom .nav-link, #offcanvasNavbar .nav-link');
    allNavLinks.forEach(link => link.classList.remove('active'));

    if (targetPageId === 'page-admin' || hash === '#admin') {
      const adminLinks = document.querySelectorAll('#nav-admin-link, #mobile-admin-link');
      adminLinks.forEach(l => l.classList.add('active'));
    } else if (targetPageId === 'page-home') {
      let targetHref = '#hero';
      if (hash === '#upcoming-events' || hash === '#events') targetHref = '#upcoming-events';
      else if (hash === '#featured-memories' || hash === '#gallery') targetHref = '#featured-memories';
      else if (hash === '#photo-of-the-week' || hash === '#spotlight') targetHref = '#photo-of-the-week';
      else if (hash === '#hero' || hash === '#home' || !hash) targetHref = '#hero';

      allNavLinks.forEach(link => {
        if (link.getAttribute('href') === targetHref) {
          link.classList.add('active');
        }
      });
    }
  }

  function handleRouting() {
    const rawHash = window.location.hash || '#home';
    const hash = rawHash.split('?')[0];
    const pageViews = document.querySelectorAll('.page-view');

    let targetPageId = 'page-home';
    if (hash === '#login') targetPageId = 'page-login';
    else if (hash === '#register') targetPageId = 'page-register';
    else if (hash === '#forgot-password') targetPageId = 'page-forgot-password';
    else if (hash === '#dashboard') targetPageId = 'page-dashboard';
    else if (hash === '#profile') targetPageId = 'page-profile';
    else if (hash === '#settings') targetPageId = 'page-settings';
    else if (hash === '#admin') targetPageId = 'page-admin';
    else if (['#hero', '#featured-memories', '#gallery', '#photo-of-the-week', '#spotlight', '#upcoming-events', '#events', '#testimonials'].includes(hash)) {
      targetPageId = 'page-home';
    }

    if (targetPageId === 'page-admin') {
      const currentUser = getCurrentUser();
      if (!isAdminUser(currentUser)) {
        showToast('Access Denied: Admin Space is restricted to Administrator accounts.', 'danger');
        window.location.hash = '#home';
        pageViews.forEach(view => {
          if (view.id === 'page-home') view.classList.remove('d-none');
          else view.classList.add('d-none');
        });
        updateNavbarActiveLinks('#home', 'page-home');
        return;
      }
    }

    pageViews.forEach(view => {
      if (view.id === targetPageId) {
        view.classList.remove('d-none');
      } else {
        view.classList.add('d-none');
      }
    });

    updateNavbarActiveLinks(hash, targetPageId);

    if (targetPageId === 'page-dashboard') {
      renderDashboardView();
    } else if (targetPageId === 'page-profile') {
      renderProfileView();
    } else if (targetPageId === 'page-settings') {
      populateSettingsView();
    } else if (targetPageId === 'page-admin') {
      renderAdminSpaceView();
    }

    // Scroll handling
    if (targetPageId === 'page-home' && hash !== '#home' && hash !== '#page-home') {
      let targetSelector = hash;
      if (hash === '#events') targetSelector = '#upcoming-events';
      else if (hash === '#gallery') targetSelector = '#featured-memories';
      else if (hash === '#spotlight') targetSelector = '#photo-of-the-week';
      const targetEl = document.querySelector(targetSelector);
      if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  window.addEventListener('hashchange', handleRouting);

  // Dashboard View Renderer
  function renderDashboardView() {
    const currentUser = getCurrentUser() || defaultUsers[0];

    const welcomeHeading = document.getElementById('dash-welcome-heading');
    const userName = document.getElementById('dash-user-name');
    const userRole = document.getElementById('dash-user-role');
    const userAvatar = document.getElementById('dash-user-avatar');
    const topAvatar = document.getElementById('dash-top-avatar');

    if (welcomeHeading) welcomeHeading.innerText = `Welcome back, ${currentUser.name.split(' ')[0]}!`;
    if (userName) userName.innerText = currentUser.name;
    if (userRole) userRole.innerText = currentUser.role || currentUser.dept || 'Student Creator';
    if (userAvatar) userAvatar.src = currentUser.avatar;
    if (topAvatar) topAvatar.src = currentUser.avatar;

    const userFavs = getUserFavorites(currentUser.id);
    const userAlbums = getUserAlbums(currentUser.id);

    const statViewed = document.getElementById('dash-stat-viewed');
    const statFavs = document.getElementById('dash-stat-favs');
    const statAlbums = document.getElementById('dash-stat-albums');
    const statEvents = document.getElementById('dash-stat-events');

    if (statViewed) statViewed.innerText = '142';
    if (statFavs) statFavs.innerText = userFavs.length;
    if (statAlbums) statAlbums.innerText = userAlbums.length;
    if (statEvents) statEvents.innerText = '8';

    // Favorites Grid in Dashboard
    const dashFavGrid = document.getElementById('dash-favorites-grid');
    if (dashFavGrid) {
      if (userFavs.length === 0) {
        dashFavGrid.innerHTML = `
          <div class="col-12 text-center py-4 text-muted extra-small">
            No favorites saved yet. Heart any photo in the gallery to save it to your dashboard!
          </div>
        `;
      } else {
        dashFavGrid.innerHTML = userFavs.map(fav => `
          <div class="col-6 col-md-3">
            <div class="fav-photo-card shadow-sm">
              <img src="${fav.img}" alt="${fav.title}" class="fav-photo-img" loading="lazy">
              <div class="fav-photo-overlay">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="badge bg-primary-subtle text-primary extra-small">${fav.tag || 'Gallery'}</span>
                  <button class="btn btn-danger btn-xs rounded-circle remove-dash-fav" data-id="${fav.id}" title="Remove Favorite">
                    <i class="bi bi-trash-fill"></i>
                  </button>
                </div>
                <div class="text-white extra-small mt-2">
                  <div class="fw-bold text-truncate">${fav.title}</div>
                  <div class="opacity-75">${fav.author}</div>
                </div>
              </div>
            </div>
          </div>
        `).join('');

        dashFavGrid.querySelectorAll('.remove-dash-fav').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const favId = btn.getAttribute('data-id');
            const updated = userFavs.filter(f => f.id !== favId);
            setUserFavorites(currentUser.id, updated);
            renderDashboardView();
            showToast('Removed photo from favorites.', 'info');
          });
        });
      }
    }

    // Recent Memories Grid
    const dashRecentGrid = document.getElementById('dash-recent-memories-grid');
    if (dashRecentGrid) {
      const sampleRecent = [
        { title: 'Central Quad Golden Hour', img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=400', date: '2 hours ago' },
        { title: 'Varsity Football Finals', img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=400', date: 'Yesterday' },
        { title: 'Music Fest Lightshow', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400', date: '3 days ago' },
        { title: 'Monsoon Quadrangle Reflection', img: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=400', date: '4 days ago' }
      ];

      dashRecentGrid.innerHTML = sampleRecent.map(m => `
        <div class="col-6">
          <div class="p-2 bg-body-tertiary rounded-3 border d-flex align-items-center gap-2">
            <img src="${m.img}" class="rounded-2" style="width: 50px; height: 50px; object-fit: cover;" alt="${m.title}">
            <div class="overflow-hidden">
              <div class="fw-bold extra-small text-truncate">${m.title}</div>
              <div class="text-muted extra-small" style="font-size: 0.7rem;">${m.date}</div>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  // Live Countdown Timer for Dashboard
  function initCountdownTimer() {
    const targetDate = new Date().getTime() + (2 * 24 * 60 * 60 * 1000) + (14 * 60 * 60 * 1000) + (32 * 60 * 1000) + (5 * 1000);

    setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) return;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const dEl = document.getElementById('cd-days');
      const hEl = document.getElementById('cd-hours');
      const mEl = document.getElementById('cd-mins');
      const sEl = document.getElementById('cd-secs');

      if (dEl) dEl.innerText = days < 10 ? '0' + days : days;
      if (hEl) hEl.innerText = hours < 10 ? '0' + hours : hours;
      if (mEl) mEl.innerText = minutes < 10 ? '0' + minutes : minutes;
      if (sEl) sEl.innerText = seconds < 10 ? '0' + seconds : seconds;
    }, 1000);
  }

  initCountdownTimer();

  // Profile View Renderer
  function renderProfileView() {
    const currentUser = getCurrentUser() || defaultUsers[0];

    syncProfileMediaDOM(currentUser);

    const activeUser = getCurrentUser();
    const isOwner = activeUser && (activeUser.id === currentUser.id);
    document.querySelectorAll('#prof-cover-actions, #prof-avatar-actions').forEach(el => {
      if (isOwner) el.classList.remove('d-none');
      else el.classList.add('d-none');
    });

    const avatar = document.getElementById('prof-page-avatar');
    const name = document.getElementById('prof-page-name');
    const role = document.getElementById('prof-page-role');
    const dept = document.getElementById('prof-page-dept');
    const email = document.getElementById('prof-page-email');

    if (avatar) avatar.src = currentUser.avatar;
    if (name) name.innerText = currentUser.name;
    if (role) role.innerText = currentUser.role || 'Student Photographer';
    if (dept) dept.innerHTML = `<i class="bi bi-mortarboard me-1"></i> ${currentUser.dept || "Media Arts '27"}`;
    if (email) email.innerText = currentUser.email;

    const fn = document.getElementById('prof-field-fullname');
    const stuid = document.getElementById('prof-field-stuid');
    const deptF = document.getElementById('prof-field-dept');
    const batchF = document.getElementById('prof-field-batch');
    const emailF = document.getElementById('prof-field-email');
    const bioF = document.getElementById('prof-field-bio');

    if (fn) fn.innerText = currentUser.name;
    if (stuid) stuid.innerText = currentUser.id.replace('usr_', 'STU-2026-');
    if (deptF) deptF.innerText = currentUser.dept || 'Media Arts';
    if (batchF) batchF.innerText = '2026 - 2028';
    if (emailF) emailF.innerText = currentUser.email;
    if (bioF) bioF.innerText = currentUser.bio || 'Campus story teller and creator.';

    const userFavs = getUserFavorites(currentUser.id);
    const userUploads = getUserUploads(currentUser);

    const vS = document.getElementById('prof-stat-viewed');
    const fS = document.getElementById('prof-stat-favs');
    const aS = document.getElementById('prof-stat-albums');
    const eS = document.getElementById('prof-stat-events');

    if (vS) vS.innerText = '142';
    if (fS) fS.innerText = userFavs.length;
    if (aS) aS.innerText = userUploads.length;
    if (eS) eS.innerText = '8';

    // 1. Published Albums & Photos Grid in Profile Page
    const profUploadsGrid = document.getElementById('prof-page-uploads-grid');
    if (profUploadsGrid) {
      if (userUploads.length === 0) {
        profUploadsGrid.innerHTML = `
          <div class="col-12 text-center py-5 text-muted extra-small">
            <i class="bi bi-journal-album fs-1 text-muted opacity-50 mb-2"></i>
            <h6 class="fw-bold text-muted">No Published Campus Memories Yet</h6>
            <p class="extra-small text-muted mb-3">Share your campus photography to feature in your personal archive!</p>
            <button class="btn btn-gradient btn-sm submit-memories-btn-trigger" data-bs-toggle="modal" data-bs-target="#uploadAlbumModal">
              <i class="bi bi-cloud-upload-fill me-1"></i> Upload First Photo
            </button>
          </div>
        `;
      } else {
        profUploadsGrid.innerHTML = userUploads.map(mem => {
          const safeImg = normalizeImgUrl(mem.imageUrl);
          const albumImgs = (Array.isArray(mem.albumImages) && mem.albumImages.length > 0) ? mem.albumImages : [safeImg];
          const isAlbum = albumImgs.length > 1;
          const albumJson = encodeURIComponent(JSON.stringify(albumImgs));

          const authorName = mem.author ? (typeof mem.author === 'object' ? mem.author.name : mem.author) : 'Student Photographer';
          const authorRole = mem.author ? (typeof mem.author === 'object' ? (mem.author.role || 'Contributor') : 'Contributor') : 'Contributor';
          const authorAvatar = mem.author ? (typeof mem.author === 'object' ? (mem.author.avatarUrl || '') : '') : '';

          const canDel = canDeleteMemory(mem);

          return `
            <div class="col-6 col-md-4">
              <div class="memory-card memory-card-trigger fav-photo-card shadow-sm position-relative rounded-3 overflow-hidden ${isAlbum ? 'album-card-stacked' : ''}"
                   style="height: 180px; cursor: pointer;"
                   data-id="${mem.id}"
                   data-title="${mem.title.replace(/"/g, '&quot;')}"
                   data-img="${safeImg}"
                   data-album="${albumJson}"
                   data-author="${authorName.replace(/"/g, '&quot;')}"
                   data-author-role="${authorRole.replace(/"/g, '&quot;')}"
                   data-author-avatar="${authorAvatar}"
                   data-location="${(mem.location || 'Campus').replace(/"/g, '&quot;')}"
                   data-date="${mem.date || 'Recent'}"
                   data-tag="${mem.badgeLabel || mem.category || 'Gallery'}"
                   data-desc="${(mem.description || mem.title).replace(/"/g, '&quot;')}">
                <img src="${safeImg}" alt="${mem.title.replace(/"/g, '&quot;')}" class="fav-photo-img" loading="lazy">
                <div class="fav-photo-overlay d-flex flex-column justify-content-between p-2">
                  <div class="d-flex justify-content-between align-items-center gap-1">
                    <div class="d-flex align-items-center gap-1 overflow-hidden">
                      ${getStatusBadgeHtml(mem.status)}
                    </div>
                    ${canDel ? `
                    <button class="btn btn-danger btn-xs px-2 py-1 rounded-pill delete-memory-trigger shadow-sm" data-id="${mem.id}" title="Delete Memory Album">
                      <i class="bi bi-trash-fill"></i>
                    </button>
                    ` : ''}
                  </div>
                  <div class="text-white extra-small mt-2">
                    <div class="fw-bold text-truncate">${mem.title}</div>
                    <div class="opacity-75 d-flex justify-content-between align-items-center mt-1">
                      <span><i class="bi bi-geo-alt me-1"></i>${mem.location || 'Campus'}</span>
                      ${isAlbum ? `<span class="badge bg-warning text-dark extra-small">${albumImgs.length} Photos</span>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
      bindMemoryCardClickListeners();
    }

    // 2. Saved Favorites Grid in Profile
    const favGrid = document.getElementById('prof-page-favorites-grid');
    if (favGrid) {
      if (userFavs.length === 0) {
        favGrid.innerHTML = `
          <div class="col-12 text-center py-4 text-muted extra-small">
            No saved favorites yet. Heart any photo in the main gallery to save it to your profile!
          </div>
        `;
      } else {
        favGrid.innerHTML = userFavs.map(fav => `
          <div class="col-6 col-md-4">
            <div class="fav-photo-card shadow-sm position-relative rounded-3 overflow-hidden" style="height: 180px;">
              <img src="${fav.img}" alt="${fav.title}" class="fav-photo-img" loading="lazy">
              <div class="fav-photo-overlay d-flex flex-column justify-content-between p-2">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="badge bg-primary-subtle text-primary extra-small">${fav.tag || 'Gallery'}</span>
                  <button class="btn btn-danger btn-xs rounded-circle remove-prof-fav shadow-sm" data-id="${fav.id}" title="Remove Favorite">
                    <i class="bi bi-trash-fill"></i>
                  </button>
                </div>
                <div class="text-white extra-small mt-2">
                  <div class="fw-bold text-truncate">${fav.title}</div>
                  <div class="opacity-75">${fav.author}</div>
                </div>
              </div>
            </div>
          </div>
        `).join('');

        favGrid.querySelectorAll('.remove-prof-fav').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const favId = btn.getAttribute('data-id');
            const updated = userFavs.filter(f => f.id !== favId);
            setUserFavorites(currentUser.id, updated);
            renderProfileView();
            showToast('Removed photo from favorites.', 'info');
          };
        });
      }
    }

    // Bind Lightbox modal triggering for cards rendered in profile
    bindMemoryCardClickListeners();
  }

  // Populate Settings View
  function populateSettingsView() {
    const currentUser = getCurrentUser() || defaultUsers[0];

    const fn = document.getElementById('settingFullName');
    const dept = document.getElementById('settingDeptRole');
    const avatar = document.getElementById('settingAvatarLink');
    const bio = document.getElementById('settingBioText');
    const darkToggle = document.getElementById('settingDarkModeToggle');

    if (fn) fn.value = currentUser.name || '';
    if (dept) dept.value = currentUser.dept || '';
    if (avatar) avatar.value = currentUser.avatar || '';
    if (bio) bio.value = currentUser.bio || '';
    if (darkToggle) darkToggle.checked = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  }

  // Dark Mode Switch Handler on Settings Page
  const darkToggleInput = document.getElementById('settingDarkModeToggle');
  if (darkToggleInput) {
    darkToggleInput.addEventListener('change', () => {
      const newTheme = darkToggleInput.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-bs-theme', newTheme);
      localStorage.setItem('campuslens-theme', newTheme);
      showToast(`Theme switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
    });
  }

  // Standalone Settings Form Submission (#page-settings)
  const standaloneSettingsForm = document.getElementById('standalone-settings-form');
  if (standaloneSettingsForm) {
    standaloneSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentUser = getCurrentUser() || defaultUsers[0];

      const fn = document.getElementById('settingFullName')?.value;
      const dept = document.getElementById('settingDeptRole')?.value;
      const avatar = document.getElementById('settingAvatarLink')?.value;
      const bio = document.getElementById('settingBioText')?.value;

      const users = getUsers();
      const updatedUser = {
        ...currentUser,
        name: fn || currentUser.name,
        dept: dept || currentUser.dept,
        avatar: avatar || currentUser.avatar,
        bio: bio || currentUser.bio
      };

      const uIdx = users.findIndex(u => u.id === currentUser.id);
      if (uIdx !== -1) {
        users[uIdx] = updatedUser;
        localStorage.setItem('campuslens_users', JSON.stringify(users));
      }

      setCurrentUser(updatedUser);
      showToast('Settings saved successfully!', 'success');
      window.location.hash = '#dashboard';
    });
  }

  // Standalone Login Form (#page-login)
  const standaloneLoginForm = document.getElementById('standalone-login-form');
  if (standaloneLoginForm) {
    standaloneLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('pageLoginEmail')?.value.trim();
      const password = document.getElementById('pageLoginPassword')?.value;

      const users = getUsers();
      const match = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

      if (match) {
        setCurrentUser(match);
        showToast(`Welcome back, ${match.name}!`, 'success');
        window.location.hash = '#dashboard';
      } else {
        showToast('Invalid credentials. Please check your email and password.', 'danger');
      }
    });
  }

  // Standalone Register Avatar Preview
  const regAvatarInput = document.getElementById('regAvatarUrl');
  const avatarPreviewImg = document.getElementById('avatar-preview-img');

  if (regAvatarInput && avatarPreviewImg) {
    regAvatarInput.addEventListener('input', () => {
      if (regAvatarInput.value.trim()) {
        avatarPreviewImg.src = regAvatarInput.value.trim();
      }
    });
  }

  document.querySelectorAll('.reg-avatar-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (regAvatarInput) regAvatarInput.value = url;
      if (avatarPreviewImg) avatarPreviewImg.src = url;
    });
  });

  // Standalone Register Form Submission (#page-register)
  const standaloneRegForm = document.getElementById('standalone-register-form');
  if (standaloneRegForm) {
    standaloneRegForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regFullName')?.value.trim();
      const studentId = document.getElementById('regStudentId')?.value.trim();
      const dept = document.getElementById('regDepartment')?.value.trim();
      const batch = document.getElementById('regBatch')?.value.trim();
      const email = document.getElementById('regEmailAddress')?.value.trim();
      const pass = document.getElementById('regPasswordVal')?.value;
      const confirmPass = document.getElementById('regConfirmPasswordVal')?.value;
      const avatar = document.getElementById('regAvatarUrl')?.value || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300';

      if (pass !== confirmPass) {
        showToast('Passwords do not match. Please recheck.', 'danger');
        return;
      }

      const users = getUsers();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        showToast('An account with this email already exists.', 'warning');
        return;
      }

      const newUser = {
        id: studentId || ('usr_' + Date.now()),
        name,
        email,
        password: pass,
        dept: dept || "Media Arts",
        role: 'Student Creator',
        avatar,
        bio: `Member of ${batch || 'Class of 2026'}. Campus photojournalism contributor.`,
        gear: 'Digital SLR Camera'
      };

      users.push(newUser);
      localStorage.setItem('campuslens_users', JSON.stringify(users));

      // Show Bootstrap Success Modal
      const regSuccessModalEl = document.getElementById('regSuccessModal');
      if (regSuccessModalEl && typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(regSuccessModalEl);
        modal.show();
      } else {
        showToast('Account registered successfully! Please sign in.', 'success');
        window.location.hash = '#login';
      }
    });
  }

  // Registration Success Modal Login Button
  const regSuccessLoginBtn = document.getElementById('reg-success-login-btn');
  if (regSuccessLoginBtn) {
    regSuccessLoginBtn.addEventListener('click', () => {
      window.location.hash = '#login';
    });
  }

  // Standalone Forgot Password Form Submission
  const standaloneForgotForm = document.getElementById('standalone-forgot-pass-form');
  if (standaloneForgotForm) {
    standaloneForgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('forgot-pass-alert-box');
      if (alertBox) alertBox.classList.remove('d-none');
      showToast('Password reset passcode sent to your email!', 'info');
    });
  }

  // Dashboard Sidebar Logout Button
  const dashLogoutBtn = document.getElementById('dash-logout-btn');
  if (dashLogoutBtn) {
    dashLogoutBtn.addEventListener('click', () => {
      setCurrentUser(null);
      showToast('You have logged out.', 'info');
      window.location.hash = '#home';
    });
  }

  // Global window functions
  window.sharePOTW = function() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Photo link copied to clipboard!', 'info');
    } else {
      showToast('Sharing link prepared!', 'info');
    }
  };

  // --------------------------------------------------------------------------
  // Upload Campus Album / Photo Modal Handler & File Upload Logic
  // --------------------------------------------------------------------------
  const uploadForm = document.getElementById('upload-album-form');
  const uploadFileInput = document.getElementById('uploadFileInput');
  const uploadDropZone = document.getElementById('uploadDropZone');
  const uploadImgUrlInput = document.getElementById('uploadImgUrl');
  const uploadAlbumPreviewContainer = document.getElementById('uploadAlbumPreviewContainer');
  const uploadAlbumThumbnailsGrid = document.getElementById('uploadAlbumThumbnailsGrid');
  const albumPhotoCountBadge = document.getElementById('albumPhotoCountBadge');
  const clearAlbumPhotosBtn = document.getElementById('clearAlbumPhotosBtn') || document.getElementById('clearAllAlbumImagesBtn');
  const addUrlToAlbumBtn = document.getElementById('addUrlToAlbumBtn');

  let currentUploadAlbumPhotos = [];

  if (uploadDropZone && uploadFileInput) {
    uploadDropZone.addEventListener('click', (e) => {
      // Prevent recursion if clicking inside a sub-button
      if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
        uploadFileInput.click();
      }
    });

    uploadDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadDropZone.classList.add('bg-primary-subtle', 'border-primary');
    });

    uploadDropZone.addEventListener('dragleave', () => {
      uploadDropZone.classList.remove('bg-primary-subtle', 'border-primary');
    });

    uploadDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadDropZone.classList.remove('bg-primary-subtle', 'border-primary');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleMultipleFilesSelection(e.dataTransfer.files);
      }
    });

    uploadFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleMultipleFilesSelection(e.target.files);
      }
    });
  }

  function compressImage(base64Str, maxWidth, maxHeight, quality, callback) {
    if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image')) {
      callback(base64Str, { width: 1920, height: 1080, aspectRatio: '16 / 9' });
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = base64Str;
    img.onload = () => {
      const origWidth = img.width;
      const origHeight = img.height;
      let width = origWidth;
      let height = origHeight;

      // Maintain high resolution (up to 2560px max dimension) and original aspect ratio
      const targetMax = maxWidth || 2560;
      if (width > targetMax || height > targetMax) {
        if (width >= height) {
          height = Math.round((origHeight * targetMax) / origWidth);
          width = targetMax;
        } else {
          width = Math.round((origWidth * targetMax) / origHeight);
          height = targetMax;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // High quality 0.92 JPEG quality to maintain crisp details & true colors
      const compressed = canvas.toDataURL('image/jpeg', quality || 0.92);
      const ratioStr = `${origWidth} / ${origHeight}`;
      callback(compressed, { width, height, origWidth, origHeight, aspectRatio: ratioStr });
    };
    img.onerror = () => {
      callback(base64Str, { width: 1920, height: 1080, aspectRatio: '16 / 9' });
    };
  }

  function compressImageToBlob(source, maxWidth, maxHeight, quality, callback) {
    if (!source) {
      callback(null, { width: 1920, height: 1080, aspectRatio: '16 / 9' });
      return;
    }

    if (source instanceof Blob || source instanceof File) {
      const tempUrl = URL.createObjectURL(source);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const origWidth = img.width;
        const origHeight = img.height;
        let width = origWidth;
        let height = origHeight;

        const targetMax = maxWidth || 2560;
        if (width > targetMax || height > targetMax) {
          if (width >= height) {
            height = Math.round((origHeight * targetMax) / origWidth);
            width = targetMax;
          } else {
            width = Math.round((origWidth * targetMax) / origHeight);
            height = targetMax;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        URL.revokeObjectURL(tempUrl);

        canvas.toBlob((compressedBlob) => {
          const ratioStr = `${origWidth} / ${origHeight}`;
          callback(compressedBlob || source, { width, height, origWidth, origHeight, aspectRatio: ratioStr });
        }, 'image/jpeg', quality || 0.92);
      };
      img.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        callback(source, { width: 1920, height: 1080, aspectRatio: '16 / 9' });
      };
      img.src = tempUrl;
    } else {
      compressImage(source, maxWidth, maxHeight, quality, (compressedDataUrl, dimensions) => {
        const blob = imageStoreDB.dataURLToBlob(compressedDataUrl);
        callback(blob || compressedDataUrl, dimensions);
      });
    }
  }

  function handleMultipleFilesSelection(fileList) {
    const files = Array.from(fileList).filter(file => file && file.type && file.type.startsWith('image/'));
    if (files.length === 0) {
      showToast('No valid image files selected.', 'warning');
      return;
    }

    let loadedCount = 0;
    const totalFiles = files.length;
    showToast(`Processing high-quality photos (${totalFiles})...`, 'info');

    files.forEach(file => {
      compressImageToBlob(file, 2560, 2560, 0.92, (compressedBlob, dimensions) => {
        const previewUrl = compressedBlob instanceof Blob ? URL.createObjectURL(compressedBlob) : compressedBlob;
        currentUploadAlbumPhotos.push({
          blob: compressedBlob,
          url: previewUrl,
          aspectRatio: dimensions ? dimensions.aspectRatio : null
        });
        loadedCount++;
        if (albumPhotoCountBadge) {
          albumPhotoCountBadge.innerText = `Processing ${loadedCount}/${totalFiles}...`;
        }
        if (loadedCount === totalFiles) {
          updateUploadAlbumPreviewGrid();
          showToast(`Added ${totalFiles} photo${totalFiles > 1 ? 's' : ''} to staged album!`, 'success');
        }
      });
    });
  }

  function updateUploadAlbumPreviewGrid() {
    if (!uploadAlbumThumbnailsGrid) return;

    if (currentUploadAlbumPhotos.length === 0) {
      if (uploadAlbumPreviewContainer) uploadAlbumPreviewContainer.classList.add('d-none');
      if (albumPhotoCountBadge) albumPhotoCountBadge.innerText = '0 Photos Ready';
      return;
    }

    if (uploadAlbumPreviewContainer) uploadAlbumPreviewContainer.classList.remove('d-none');
    if (albumPhotoCountBadge) albumPhotoCountBadge.innerText = `${currentUploadAlbumPhotos.length} Photo${currentUploadAlbumPhotos.length > 1 ? 's' : ''} Ready`;

    uploadAlbumThumbnailsGrid.innerHTML = currentUploadAlbumPhotos.map((item, index) => {
      const src = typeof item === 'string' ? item : item.url;
      return `
        <div class="position-relative group rounded-3 overflow-hidden border shadow-sm bg-dark" style="height: 90px;">
          <img src="${src}" class="w-100 h-100 object-fit-cover" alt="Preview ${index + 1}">
          <span class="position-absolute top-0 start-0 bg-dark text-white extra-small px-2 py-1 rounded-bottom-end opacity-85">#${index + 1}</span>
          <button type="button" class="btn btn-danger btn-sm p-0 position-absolute top-0 end-0 m-1 rounded-circle remove-album-thumb-btn" data-index="${index}" style="width: 22px; height: 22px; line-height: 1;" title="Remove photo">
            <i class="bi bi-x"></i>
          </button>
        </div>
      `;
    }).join('');

    uploadAlbumThumbnailsGrid.querySelectorAll('.remove-album-thumb-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index') || '0', 10);
        currentUploadAlbumPhotos.splice(idx, 1);
        updateUploadAlbumPreviewGrid();
      };
    });
  }

  if (clearAlbumPhotosBtn) {
    clearAlbumPhotosBtn.addEventListener('click', () => {
      currentUploadAlbumPhotos = [];
      if (uploadFileInput) uploadFileInput.value = '';
      updateUploadAlbumPreviewGrid();
      showToast('Cleared all staged album photos.', 'info');
    });
  }

  if (addUrlToAlbumBtn) {
    addUrlToAlbumBtn.addEventListener('click', () => {
      const url = uploadImgUrlInput?.value.trim();
      if (!url) {
        showToast('Please paste a photo URL first.', 'warning');
        return;
      }
      currentUploadAlbumPhotos.push(url);
      if (uploadImgUrlInput) uploadImgUrlInput.value = '';
      updateUploadAlbumPreviewGrid();
      showToast('Photo URL added to staged album!', 'success');
    });
  }

  // Handle Preset Image Buttons inside Upload Modal
  document.querySelectorAll('.upload-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (url) {
        currentUploadAlbumPhotos.push(url);
        updateUploadAlbumPreviewGrid();
        showToast('Preset sample photo added to album!', 'info');
      }
    });
  });

  // Handle Form Submission for Upload Album / Photo
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const userTitleInput = document.getElementById('uploadTitle')?.value.trim();
      const category = document.getElementById('uploadCategory')?.value || 'CSE';
      const urlVal = document.getElementById('uploadImgUrl')?.value.trim();
      const location = document.getElementById('uploadLocation')?.value.trim() || 'Main Campus';
      const authorInput = document.getElementById('uploadAuthor')?.value.trim();
      const description = document.getElementById('uploadDescription')?.value.trim();

      // If URL is typed but not added via button, push it to staged array
      if (urlVal) {
        const alreadyIn = currentUploadAlbumPhotos.some(item => (typeof item === 'string' ? item : item.url) === urlVal);
        if (!alreadyIn) {
          currentUploadAlbumPhotos.push(urlVal);
        }
      }

      if (currentUploadAlbumPhotos.length === 0) {
        showToast('Please upload or select at least 1 photo for your submission.', 'warning');
        return;
      }

      showToast('Uploading photos to Supabase Cloud Storage...', 'info');

      const imageKeys = [];
      const resolvedUrls = [];

      for (let i = 0; i < currentUploadAlbumPhotos.length; i++) {
        const item = currentUploadAlbumPhotos[i];
        let source = typeof item === 'string' ? item : (item.blob || item.file || item.url);
        const aspect = (item && typeof item === 'object') ? item.aspectRatio : null;

        // 1. Upload to Supabase Cloud Storage bucket 'mulens-media'
        const cloudUrl = await uploadMediaToSupabase(source, 'memories');

        // 2. Also save locally in IndexedDB as fallback
        let blobKey = null;
        if (!(typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://')))) {
          blobKey = await imageStoreDB.saveBlob(source, null, aspect);
        }

        if (blobKey) imageKeys.push(blobKey);

        const finalUrl = cloudUrl || (blobKey ? imageStoreDB.getUrlForBlobKey(blobKey) : source);
        resolvedUrls.push(finalUrl);
      }

      const mainImageUrl = resolvedUrls[0] || '';
      const primaryPhotoItem = currentUploadAlbumPhotos[0];
      const primaryAspectRatio = (primaryPhotoItem && typeof primaryPhotoItem === 'object' && primaryPhotoItem.aspectRatio)
        ? primaryPhotoItem.aspectRatio
        : null;

      const categoryLabelMap = {
        'CSE': 'CSE Department',
        'eee': 'EEE Department',
        'law': 'Law Department',
        'bba': 'BBA Department',
        'english': 'English Department',
        'university_events': 'University events',
        'campus': 'Campus'
      };

      const categoryIconMap = {
        'CSE': 'bi-laptop',
        'eee': 'bi-cpu',
        'law': 'bi-bank',
        'bba': 'bi-briefcase-fill',
        'english': 'bi-book-fill',
        'university_events': 'bi-calendar-event',
        'campus': 'bi-camera-fill'
      };

      const badgeLabel = categoryLabelMap[category] || category.toUpperCase();
      const badgeIcon = categoryIconMap[category] !== undefined ? categoryIconMap[category] : 'bi-images';

      // Title creation
      const title = userTitleInput || `${badgeLabel} ${resolvedUrls.length > 1 ? 'Album' : 'Memory'} (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

      const currentUser = getCurrentUser();
      const isUserAdmin = currentUser ? isAdminUser(currentUser) : false;
      const initialStatus = isUserAdmin ? 'approved' : 'pending';

      const authorName = authorInput || (currentUser ? currentUser.name : 'Student Photographer');
      const authorAvatar = currentUser ? currentUser.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';
      const authorRole = currentUser ? (currentUser.role || currentUser.dept || 'Campus Contributor') : 'Student Photographer';

      const newMemory = {
        id: 'mem_custom_' + Date.now(),
        title: title,
        imageUrl: mainImageUrl,
        imageUrlKey: imageKeys[0] || null,
        albumImages: resolvedUrls,
        imageKeys: imageKeys,
        status: initialStatus,
        ownerId: currentUser ? currentUser.id : null,
        userId: currentUser ? currentUser.id : null,
        createdAt: Date.now(),
        approvedAt: isUserAdmin ? Date.now() : null,
        approvedBy: isUserAdmin ? (currentUser ? (currentUser.id || currentUser.name) : 'Admin') : null,
        author: {
          id: currentUser ? currentUser.id : null,
          name: authorName,
          role: authorRole,
          avatarUrl: authorAvatar
        },
        location: location,
        date: 'Just Now',
        category: category,
        badgeLabel: badgeLabel,
        badgeIcon: badgeIcon,
        likesCount: 1,
        aspectRatio: primaryAspectRatio,
        aspectRatioClass: primaryAspectRatio ? '' : 'ratio-portrait-4-5',
        description: description || `${resolvedUrls.length > 1 ? 'Album containing ' + resolvedUrls.length + ' photos' : title} from ${badgeLabel}.`,
        tags: [category, 'UserUpload', resolvedUrls.length > 1 ? 'Album' : 'Photo']
      };

      // Save custom uploaded memory in Supabase Cloud Database
      await saveMemoryToSupabase(newMemory);

      // Save custom uploaded memory in IndexedDB as fallback
      await imageStoreDB.saveMemory(newMemory);

      // Refresh cloud memories cache
      await fetchMemoriesFromSupabase();

      // Sync with Logged-in User Albums if user is signed in
      if (currentUser) {
        const newAlbum = {
          id: newMemory.id,
          title: title,
          category: badgeLabel,
          imgUrl: mainImageUrl,
          albumImages: resolvedUrls,
          location: location,
          date: 'Just Now'
        };
        const existingAlbums = getUserAlbums(currentUser.id);
        setUserAlbums(currentUser.id, [newAlbum, ...existingAlbums]);
      }

      // Prepend to MULensData.FEATURED_MEMORIES array in runtime memory
      if (Array.isArray(MULensData.FEATURED_MEMORIES)) {
        if (!MULensData.FEATURED_MEMORIES.some(m => m.id === newMemory.id)) {
          MULensData.FEATURED_MEMORIES.unshift(newMemory);
        }
      }

      // Re-render gallery & profile views (which re-binds filters, search, and click listeners)
      renderDynamicDataFromDataTS();
      renderProfileTabs();
      renderProfileView();

      // Automatically switch filter tab to the chosen category so the user immediately sees their album!
      const matchingCategoryBtn = document.querySelector(`.filter-btn[data-filter="${category}"]`);
      if (matchingCategoryBtn) {
        matchingCategoryBtn.click();
      } else {
        const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allFilterBtn) allFilterBtn.click();
      }

      // Hide modal
      const modalEl = document.getElementById('uploadAlbumModal');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modalInstance.hide();
      }

      // Reset staged photos
      currentUploadAlbumPhotos = [];
      updateUploadAlbumPreviewGrid();
      uploadForm.reset();

      // Feedback and scroll
      if (initialStatus === 'pending') {
        showToast('🟡 Your media has been submitted for review.', 'warning');
      } else {
        showToast(`🟢 ${resolvedUrls.length > 1 ? 'Album' : 'Photo'} "${title}" published to live gallery!`, 'success');
      }
      const gallerySection = document.getElementById('featured-memories');
      if (gallerySection) {
        gallerySection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Registration Modal Profile Picture Selection & Upload Handler
  const regModalAvatarFile = document.getElementById('regModalAvatarFile');
  const regModalUploadAvatarBtn = document.getElementById('regModalUploadAvatarBtn');
  const regModalAvatarPreview = document.getElementById('regModalAvatarPreview');
  let selectedRegistrationAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200';

  if (regModalUploadAvatarBtn && regModalAvatarFile) {
    regModalUploadAvatarBtn.addEventListener('click', () => regModalAvatarFile.click());

    regModalAvatarFile.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
          showToast('Please select a valid image file for your profile picture.', 'warning');
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          compressImage(ev.target.result, 300, 300, 0.85, (compressed) => {
            selectedRegistrationAvatar = compressed;
            if (regModalAvatarPreview) regModalAvatarPreview.src = compressed;
            showToast('Profile photo updated!', 'info');
          });
        };
        reader.readAsDataURL(file);
      }
    });
  }

  document.querySelectorAll('.modal-avatar-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (url) {
        selectedRegistrationAvatar = url;
        if (regModalAvatarPreview) regModalAvatarPreview.src = url;
        showToast('Avatar preset selected!', 'info');
      }
    });
  });

  // --------------------------------------------------------------------------
  // Admin Space Control Center Logic & State Management
  // --------------------------------------------------------------------------
  // Helper: Ensure admin secret is available (reuses existing Admin Verification modal)
  async function ensureAdminSecret() {
    return new Promise((resolve) => {
      try {
        const existing = sessionStorage.getItem('mulens_admin_secret');
        if (existing) return resolve(existing);

        const adminModalEl = document.getElementById('adminVerificationModal');
        const secretInput = document.getElementById('adminSecretKeyInput');
        const errorAlert = document.getElementById('adminVerificationError');
        const formEl = document.getElementById('admin-verification-form');
        const submitBtn = document.getElementById('adminVerificationSubmitBtn');
        const cancelBtn = document.getElementById('adminVerificationCancelBtn');

        if (!adminModalEl || !secretInput || !submitBtn) return resolve(null);

        const modalInstance = (window.bootstrap && bootstrap.Modal)
          ? bootstrap.Modal.getOrCreateInstance(adminModalEl)
          : null;

        // preserve existing handlers so we can restore them
        const oldFormOnsubmit = formEl ? formEl.onsubmit : null;
        const oldSubmitOnclick = submitBtn.onclick;
        const oldCancelOnclick = cancelBtn ? cancelBtn.onclick : null;

        if (secretInput) secretInput.value = '';
        if (errorAlert) errorAlert.classList.add('d-none');

        const cleanup = () => {
          if (formEl) formEl.onsubmit = oldFormOnsubmit;
          submitBtn.onclick = oldSubmitOnclick;
          if (cancelBtn) cancelBtn.onclick = oldCancelOnclick;
          adminModalEl.removeEventListener('hidden.bs.modal', hiddenHandler);
        };

        const submitHandler = (e) => {
          if (e && e.preventDefault) e.preventDefault();
          const val = secretInput.value ? secretInput.value.trim() : '';
          if (!val) {
            if (errorAlert) {
              errorAlert.innerText = 'Please enter admin secret.';
              errorAlert.classList.remove('d-none');
            }
            return;
          }
          sessionStorage.setItem('mulens_admin_secret', val);
          cleanup();
          if (modalInstance) modalInstance.hide();
          resolve(val);
        };

        const cancelHandler = (e) => {
          if (e && e.preventDefault) e.preventDefault();
          cleanup();
          if (modalInstance) modalInstance.hide();
          resolve(null);
        };

        const hiddenHandler = () => {
          // modal closed without submitting
          cleanup();
          resolve(null);
        };

        if (formEl) formEl.onsubmit = submitHandler;
        submitBtn.onclick = submitHandler;
        if (cancelBtn) cancelBtn.onclick = cancelHandler;
        adminModalEl.addEventListener('hidden.bs.modal', hiddenHandler);

        if (modalInstance) {
          modalInstance.show();
          setTimeout(() => { try { secretInput.focus(); } catch (e) {} }, 80);
        } else {
          // no bootstrap modal available -> fallback
          resolve(null);
        }
      } catch (err) {
        console.error('[ensureAdminSecret] Error:', err);
        resolve(null);
      }
    });
  }
  function renderAdminSpaceView() {
    // 1. Render Active POTW Preview (use server-side global POTW only)
    const potwPreviewEl = document.getElementById('admin-active-potw-preview');
    const activePotw = window.__POTW_GLOBAL || null;

    if (potwPreviewEl) {
      if (!activePotw) {
        potwPreviewEl.innerHTML = `<div class="d-flex align-items-center justify-content-center h-100 text-muted">No Photo of the Week configured.</div>`;
      } else {
        potwPreviewEl.innerHTML = `
          <img src="${normalizeImgUrl(activePotw.imageUrl)}" class="w-100 h-100 object-fit-cover position-absolute inset-0" alt="${activePotw.title}" style="height: 220px;">
          <div class="position-absolute bottom-0 start-0 end-0 p-3 bg-dark bg-opacity-75 text-white">
            <span class="badge bg-warning text-dark mb-1">${activePotw.badgeLabel || 'POTW'}</span>
            <h6 class="fw-bold text-truncate mb-0">${activePotw.title}</h6>
            <div class="extra-small text-white-50">By ${activePotw.author ? activePotw.author.name : 'Photographer'}</div>
          </div>
        `;
      }
    }

    // Pre-fill Custom POTW form
    const potwTitleInput = document.getElementById('adminPotwTitle');
    const potwUrlInput = document.getElementById('adminPotwImageUrl');
    const potwAuthorInput = document.getElementById('adminPotwAuthorName');
    const potwRoleInput = document.getElementById('adminPotwAuthorRole');
    const potwLocInput = document.getElementById('adminPotwLocation');
    const potwBadgeInput = document.getElementById('adminPotwBadge');
    const potwQuoteInput = document.getElementById('adminPotwQuote');

    if (potwTitleInput) potwTitleInput.value = activePotw ? (activePotw.title || '') : '';
    if (potwUrlInput) potwUrlInput.value = activePotw ? (activePotw.imageUrl || '') : '';
    if (potwAuthorInput) potwAuthorInput.value = activePotw ? (activePotw.author ? activePotw.author.name : '') : '';
    if (potwRoleInput) potwRoleInput.value = activePotw ? (activePotw.author ? activePotw.author.role : '') : '';
    if (potwLocInput) potwLocInput.value = activePotw ? (activePotw.location || '') : '';
    if (potwBadgeInput) potwBadgeInput.value = activePotw ? (activePotw.badgeLabel || 'Winner • Photo Of The Week') : '';
    if (potwQuoteInput) potwQuoteInput.value = activePotw ? (activePotw.description || '') : '';

    // 2. Load all active gallery items
    let allMemories = getAllMemoriesCombined();

    // Populate Quick Select Memory dropdown
    const potwSelect = document.getElementById('admin-potw-select-memory');
    if (potwSelect) {
      potwSelect.innerHTML = `<option value="">-- Choose a photo/album from live gallery --</option>` +
        allMemories.map(m => `<option value="${m.id}">${m.title} (${m.badgeLabel || m.category}) - By ${m.author ? m.author.name : 'Unknown'}</option>`).join('');
    }

    // Populate Photos Count badge
    const totalCountSpan = document.getElementById('admin-total-photos-count');
    if (totalCountSpan) totalCountSpan.innerText = allMemories.length;

    // 3. Populate Pending Submissions Moderation Queue
    const pendingMemories = allMemories.filter(m => m.status === 'pending');

    const pendingBadge = document.getElementById('admin-pending-count-badge');
    const pendingHeaderBadge = document.getElementById('admin-pending-header-count');
    if (pendingBadge) pendingBadge.innerText = pendingMemories.length;
    if (pendingHeaderBadge) pendingHeaderBadge.innerText = pendingMemories.length;

    const pendingContainer = document.getElementById('admin-pending-submissions-list');
    if (pendingContainer) {
      if (pendingMemories.length === 0) {
        pendingContainer.innerHTML = `
          <div class="col-12 text-center py-5">
            <div class="p-4 bg-body-tertiary rounded-4 border border-dashed text-center max-w-md mx-auto">
              <i class="bi bi-shield-check text-success display-4 mb-2"></i>
              <h6 class="fw-bold text-body mb-1">Queue Clear & Up To Date</h6>
              <p class="text-muted extra-small mb-0">There are currently no pending media submissions awaiting moderation review.</p>
            </div>
          </div>
        `;
      } else {
        pendingContainer.innerHTML = pendingMemories.map(mem => {
          const safeImg = normalizeImgUrl(mem.imageUrl);
          const albumImgs = (Array.isArray(mem.albumImages) && mem.albumImages.length > 0) ? mem.albumImages : [safeImg];
          const isAlbum = albumImgs.length > 1;

          const authorName = mem.author ? (typeof mem.author === 'object' ? mem.author.name : mem.author) : 'Student Photographer';
          const authorRole = mem.author ? (typeof mem.author === 'object' ? (mem.author.role || 'Contributor') : 'Contributor') : 'Contributor';
          const authorAvatar = mem.author ? (typeof mem.author === 'object' ? (mem.author.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200') : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200') : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200';

          const uploadDateStr = mem.createdAt 
            ? new Date(mem.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : (mem.date || 'Recent');

          return `
            <div class="col-12 col-lg-6">
              <div class="card bg-body-tertiary border shadow-sm rounded-3 overflow-hidden h-100">
                <div class="row g-0 h-100">
                  <div class="col-sm-5 position-relative bg-black d-flex align-items-center justify-content-center" style="min-height: 200px;">
                    <img src="${safeImg}" alt="${mem.title.replace(/"/g, '&quot;')}" class="w-100 h-100 object-fit-cover position-absolute top-0 start-0">
                    <span class="badge bg-warning text-dark border border-warning-subtle position-absolute top-0 start-0 m-2 shadow-sm extra-small fw-bold">
                      <i class="bi bi-clock-history me-1"></i>🟡 Pending Review
                    </span>
                    ${isAlbum ? `<span class="badge bg-dark bg-opacity-75 text-white position-absolute bottom-0 end-0 m-2 extra-small"><i class="bi bi-images me-1"></i>${albumImgs.length} Photos</span>` : ''}
                  </div>
                  <div class="col-sm-7 p-3 d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex align-items-center justify-content-between gap-1 mb-2">
                        <span class="badge bg-primary-subtle text-primary extra-small">${mem.badgeLabel || mem.category || 'Memory'}</span>
                        <span class="text-muted extra-small"><i class="bi bi-calendar3 me-1"></i>${uploadDateStr}</span>
                      </div>
                      <h6 class="fw-bold font-heading text-truncate mb-2" title="${mem.title.replace(/"/g, '&quot;')}">${mem.title}</h6>
                      <p class="text-muted extra-small line-clamp-2 mb-3">${mem.description || 'Submitted media album pending moderation.'}</p>
                      
                      <!-- Uploader details -->
                      <div class="d-flex align-items-center gap-2 p-2 bg-body rounded-3 border mb-3">
                        <img src="${authorAvatar}" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;" alt="${authorName}">
                        <div class="overflow-hidden">
                          <div class="fw-bold extra-small text-truncate">${authorName}</div>
                          <div class="text-muted extra-small text-truncate">${authorRole}</div>
                        </div>
                      </div>
                    </div>

                    <!-- Action buttons -->
                    <div class="d-flex align-items-center gap-1 pt-2 border-top">
                      <button type="button" class="btn btn-outline-info btn-xs rounded-pill flex-fill view-pending-preview-btn" data-id="${mem.id}" title="Preview Fullscreen">
                        <i class="bi bi-eye-fill me-1"></i> Preview
                      </button>
                      <button type="button" class="btn btn-success btn-xs rounded-pill flex-fill approve-pending-btn" data-id="${mem.id}" title="Approve & Publish">
                        <i class="bi bi-check-circle-fill me-1"></i> Approve
                      </button>
                      <button type="button" class="btn btn-outline-danger btn-xs rounded-pill flex-fill reject-pending-btn" data-id="${mem.id}" title="Reject Submission">
                        <i class="bi bi-x-circle-fill me-1"></i> Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('');

        // Bind pending card event listeners
        pendingContainer.querySelectorAll('.view-pending-preview-btn').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const memId = btn.getAttribute('data-id');
            const selectedMem = pendingMemories.find(m => String(m.id) === String(memId));
            if (selectedMem) {
              openMemoryInLightbox(selectedMem);
              openFullscreenPhotoViewer();
            }
          };
        });

        pendingContainer.querySelectorAll('.approve-pending-btn').forEach(btn => {
          btn.onclick = async (e) => {
            e.stopPropagation();
            const memId = btn.getAttribute('data-id');
            await approveMemorySubmission(memId);
          };
        });

        pendingContainer.querySelectorAll('.reject-pending-btn').forEach(btn => {
          btn.onclick = async (e) => {
            e.stopPropagation();
            const memId = btn.getAttribute('data-id');
            await rejectMemorySubmission(memId);
          };
        });
      }
    }

    // Populate Photos Table
    const adminTableBody = document.getElementById('admin-photos-table-body');
    if (adminTableBody) {
      if (allMemories.length === 0) {
        adminTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No active photos in gallery.</td></tr>`;
      } else {
        adminTableBody.innerHTML = allMemories.map(mem => {
          const safeImg = normalizeImgUrl(mem.imageUrl);
          const isAlbum = Array.isArray(mem.albumImages) && mem.albumImages.length > 1;
          const albumCount = isAlbum ? mem.albumImages.length : 1;

          const st = mem.status || 'approved';
          let statusBadge = '<span class="badge bg-success-subtle text-success extra-small ms-1">Published</span>';
          if (st === 'pending') {
            statusBadge = '<span class="badge bg-warning-subtle text-warning extra-small ms-1">Pending</span>';
          } else if (st === 'rejected') {
            statusBadge = '<span class="badge bg-danger-subtle text-danger extra-small ms-1">Rejected</span>';
          }

          return `
            <tr>
              <td>
                <img src="${safeImg}" alt="${mem.title.replace(/"/g, '&quot;')}" class="rounded border" style="width: 50px; height: 50px; object-fit: cover;">
              </td>
              <td>
                <div class="fw-bold text-truncate" style="max-width: 220px;">${mem.title}</div>
                <div class="d-flex align-items-center gap-1">
                  <span class="badge bg-primary-subtle text-primary extra-small">${mem.badgeLabel || mem.category}</span>
                  ${statusBadge}
                </div>
              </td>
              <td>
                <div class="fw-semibold text-truncate" style="max-width: 140px;">${mem.author ? mem.author.name : 'Contributor'}</div>
                <div class="text-muted extra-small">${mem.author ? (mem.author.role || 'Member') : ''}</div>
              </td>
              <td>
                <div><i class="bi bi-geo-alt me-1 text-danger"></i>${mem.location || 'Campus'}</div>
                <div class="text-muted extra-small">${mem.date || 'Recent'}</div>
              </td>
              <td>
                ${isAlbum ? `<span class="badge bg-warning text-dark"><i class="bi bi-images me-1"></i>Album (${albumCount})</span>` : `<span class="badge bg-secondary"><i class="bi bi-image me-1"></i>Single</span>`}
              </td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  ${st === 'pending' ? `
                  <button type="button" class="btn btn-success btn-xs approve-admin-memory-btn" data-id="${mem.id}" title="Approve & Publish">
                    <i class="bi bi-check-circle-fill"></i> Approve
                  </button>
                  ` : ''}
                  <button type="button" class="btn btn-outline-info btn-xs view-admin-memory-btn" data-id="${mem.id}" title="View Fullscreen Album">
                    <i class="bi bi-eye-fill"></i> View
                  </button>
                  <button type="button" class="btn btn-outline-warning btn-xs set-potw-admin-btn" data-id="${mem.id}" title="Set as Photo of the Week">
                    <i class="bi bi-award-fill"></i> POTW
                  </button>
                  <button type="button" class="btn btn-outline-primary btn-xs edit-admin-memory-btn" data-id="${mem.id}" title="Edit Memory Details">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button type="button" class="btn btn-outline-danger btn-xs delete-admin-memory-btn" data-id="${mem.id}" title="Delete Memory">
                    <i class="bi bi-trash-fill"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');

        // Bind table action listeners
        adminTableBody.querySelectorAll('.approve-admin-memory-btn').forEach(btn => {
          btn.onclick = async (e) => {
            e.stopPropagation();
            e.preventDefault();
            const memId = btn.getAttribute('data-id');
            await approveMemorySubmission(memId);
          };
        });

        // Bind table action listeners
        adminTableBody.querySelectorAll('.view-admin-memory-btn').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const memId = btn.getAttribute('data-id');
            const selectedMem = allMemories.find(m => String(m.id) === String(memId));
            if (selectedMem) {
              openMemoryInLightbox(selectedMem);
              openFullscreenPhotoViewer();
            }
          };
        });

        adminTableBody.querySelectorAll('.delete-admin-memory-btn').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const memId = btn.getAttribute('data-id');
            showCustomDeleteModal(() => {
              deleteMemoryItem(memId);
            });
          };
        });

        adminTableBody.querySelectorAll('.set-potw-admin-btn').forEach(btn => {
          btn.onclick = async (e) => {
            e.stopPropagation();
            e.preventDefault();
            const memId = btn.getAttribute('data-id');
            const selectedMem = allMemories.find(m => m.id === memId);
            if (selectedMem) {
              const adminSecret = await ensureAdminSecret();
              if (!adminSecret) return;
              const resp = await setPOTWOnServer({ memId: selectedMem.id, custom: null, adminSecret });
              if (resp && resp.ok && resp.body && resp.body.success) {
                window.__POTW_GLOBAL = resp.body.potw || {
                  type: 'memory', memId: selectedMem.id, title: selectedMem.title, imageUrl: selectedMem.imageUrl,
                  author: selectedMem.author, location: selectedMem.location, date: selectedMem.date || 'Weekly Spotlight', badgeLabel: 'Winner • Photo Of The Week'
                };
                renderPOTWSection();
                renderAdminSpaceView();
                showToast(`Photo "${selectedMem.title}" is now set as Photo of the Week!`, 'success');
              } else if (resp && !resp.ok) {
                if (resp.status === 401) {
                  sessionStorage.removeItem('mulens_admin_secret');
                  showToast('Admin verification failed. Please verify again.', 'danger');
                  return;
                }
                const serverMsg = resp.body && (resp.body.error || resp.body.message || JSON.stringify(resp.body)) || `HTTP ${resp.status}`;
                showToast(`Server error setting POTW: ${serverMsg}`, 'danger');
              } else {
                showToast('Unexpected error setting POTW; check server logs.', 'danger');
              }
            }
          };
        });

        adminTableBody.querySelectorAll('.edit-admin-memory-btn').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const memId = btn.getAttribute('data-id');
            const memToEdit = allMemories.find(m => m.id === memId);
            if (memToEdit) {
              const idEl = document.getElementById('editMemoryId');
              const titleEl = document.getElementById('editMemoryTitle');
              const catEl = document.getElementById('editMemoryCategory');
              const urlEl = document.getElementById('editMemoryImgUrl');
              const authEl = document.getElementById('editMemoryAuthor');
              const locEl = document.getElementById('editMemoryLocation');
              const descEl = document.getElementById('editMemoryDesc');

              if (idEl) idEl.value = memToEdit.id;
              if (titleEl) titleEl.value = memToEdit.title || '';
              if (catEl) catEl.value = memToEdit.category || 'CSE';
              if (urlEl) urlEl.value = memToEdit.imageUrl || '';
              if (authEl) authEl.value = memToEdit.author ? memToEdit.author.name : '';
              if (locEl) locEl.value = memToEdit.location || '';
              if (descEl) descEl.value = memToEdit.description || '';

              const modalEl = document.getElementById('adminEditMemoryModal');
              if (modalEl && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
              }
            }
          };
        });
      }
    }

    // Admin Table Search Filter
    const adminSearchInput = document.getElementById('admin-photo-search-input');
    if (adminSearchInput && adminTableBody) {
      adminSearchInput.oninput = () => {
        const q = adminSearchInput.value.toLowerCase().trim();
        const rows = adminTableBody.querySelectorAll('tr');
        rows.forEach(row => {
          const text = row.innerText.toLowerCase();
          row.style.display = text.includes(q) ? '' : 'none';
        });
      };
    }

    // Render Campus Events in Admin Space
    renderAdminEventsManager();

    // Render Campus Voices in Admin Space
    renderAdminVoicesManager();

    // Background refresh Campus Voices from authoritative global storage
    fetchAllCampusVoices().then(freshData => {
      if (freshData && Array.isArray(freshData.voices)) {
        window.__VOICES_GLOBAL = {
          voices: freshData.voices,
          featuredVoiceId: freshData.featuredVoiceId || null
        };
        renderAdminVoicesManager();
        renderCampusVoices();
      }
    }).catch(() => {});
  }

  function bindAdminEventListeners() {
    // Campus Events Admin Listeners
    bindAdminEventsListeners();

    // Campus Voices Admin Listeners
    bindAdminVoicesListeners();

    // 1. Set Selected Memory as POTW
    const applyPotwBtn = document.getElementById('admin-apply-selected-potw');
    if (applyPotwBtn) {
      applyPotwBtn.onclick = async () => {
        const selVal = document.getElementById('admin-potw-select-memory')?.value;
        if (!selVal) {
          showToast('Please select a photo from the dropdown first.', 'warning');
          return;
        }
        const customMemories = imageStoreDB.cachedMemories || [];
        let baseMemories = (window.MULensData && Array.isArray(window.MULensData.FEATURED_MEMORIES)) ? window.MULensData.FEATURED_MEMORIES : [];
        let allMemories = [...baseMemories, ...customMemories];
        const match = allMemories.find(m => m.id === selVal);
        if (match) {
          const adminSecret = await ensureAdminSecret();
          if (!adminSecret) return;
          const resp = await setPOTWOnServer({ memId: match.id, custom: null, adminSecret });
          if (resp && resp.ok && resp.body && resp.body.success) {
            window.__POTW_GLOBAL = resp.body.potw || {
              type: 'memory', memId: match.id, title: match.title, imageUrl: match.imageUrl,
              author: match.author, location: match.location, date: match.date || 'Weekly Spotlight', badgeLabel: 'Winner • Photo Of The Week'
            };
            renderPOTWSection();
            renderAdminSpaceView();
            showToast(`Set "${match.title}" as Photo of the Week!`, 'success');
          } else if (resp && !resp.ok) {
            if (resp.status === 401) {
              sessionStorage.removeItem('mulens_admin_secret');
              showToast('Admin verification failed. Please verify again.', 'danger');
              return;
            }
            const serverMsg = resp.body && (resp.body.error || resp.body.message || JSON.stringify(resp.body)) || `HTTP ${resp.status}`;
            showToast(`Server error setting POTW: ${serverMsg}`, 'danger');
          } else {
            showToast('Unexpected error setting POTW; check server logs.', 'danger');
          }
        }
      };
    }

    // 2. Reset POTW to Default
    const resetPotwBtn = document.getElementById('admin-reset-potw-btn');
    if (resetPotwBtn) {
      resetPotwBtn.onclick = async () => {
        const adminSecret = await ensureAdminSecret();
        if (!adminSecret) return;
        try {
          const res = await fetch('/api/set-potw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
            body: JSON.stringify({ action: 'clear' })
          });
          if (res.ok) {
            window.__POTW_GLOBAL = null;
            renderPOTWSection();
            renderAdminSpaceView();
            showToast('Reset Photo of the Week on server successfully.', 'info');
          } else {
            if (res.status === 401) {
              sessionStorage.removeItem('mulens_admin_secret');
              showToast('Admin verification failed. Please verify again.', 'danger');
              return;
            }
            let body = {};
            try { body = await res.json(); } catch (e) { body = { message: await res.text() }; }
            const msg = body.error || body.message || `HTTP ${res.status}`;
            showToast(`Server error clearing POTW: ${msg}`, 'danger');
          }
        } catch (e) {
          showToast('Failed to clear Photo of the Week on server; no local changes made.', 'danger');
        }
      };
    }

    // 3. Custom POTW Form Submission
    const customPotwForm = document.getElementById('admin-custom-potw-form');
    if (customPotwForm) {
      customPotwForm.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('adminPotwTitle')?.value.trim();
        const imageUrl = document.getElementById('adminPotwImageUrl')?.value.trim();
        const authorName = document.getElementById('adminPotwAuthorName')?.value.trim();
        const authorRole = document.getElementById('adminPotwAuthorRole')?.value.trim();
        const location = document.getElementById('adminPotwLocation')?.value.trim();
        const badgeLabel = document.getElementById('adminPotwBadge')?.value.trim();
        const description = document.getElementById('adminPotwQuote')?.value.trim();

        const potwObj = {
          id: 'potw_custom_' + Date.now(),
          title: title || 'Photo of the Week',
          imageUrl: imageUrl,
          author: {
            name: authorName || 'Featured Photographer',
            role: authorRole || 'Senior Photojournalist',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'
          },
          location: location || 'Campus',
          date: 'Weekly Spotlight',
          badgeLabel: badgeLabel || 'Winner • Photo Of The Week',
          description: description || title
        };

        const adminSecret = await ensureAdminSecret();
        if (!adminSecret) return;
        const resp = await setPOTWOnServer({ memId: null, custom: potwObj, adminSecret });
        if (resp && resp.ok && resp.body && resp.body.success) {
          window.__POTW_GLOBAL = resp.body.potw || potwObj;
          renderPOTWSection();
          renderAdminSpaceView();
          showToast('Custom Photo of the Week published successfully!', 'success');
        } else if (resp && !resp.ok) {
          if (resp.status === 401) {
            sessionStorage.removeItem('mulens_admin_secret');
            showToast('Admin verification failed. Please verify again.', 'danger');
            return;
          }
          const serverMsg = resp.body && (resp.body.error || resp.body.message || JSON.stringify(resp.body)) || `HTTP ${resp.status}`;
          showToast(`Server error publishing custom POTW: ${serverMsg}`, 'danger');
        } else {
          showToast('Unexpected error publishing custom POTW; check server logs.', 'danger');
        }
      };
    }

    // 4. Add Video / Story Form Submission
    const adminVideoForm = document.getElementById('admin-add-video-form');
    if (adminVideoForm) {
      adminVideoForm.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('adminVideoTitle')?.value.trim();
        const category = document.getElementById('adminVideoCategory')?.value || 'campus';
        const videoUrl = document.getElementById('adminVideoUrl')?.value.trim();
        const author = document.getElementById('adminVideoAuthor')?.value.trim() || 'Admin Creator';
        const location = document.getElementById('adminVideoLocation')?.value.trim() || 'Campus Grounds';
        const desc = document.getElementById('adminVideoDesc')?.value.trim();

        const newVideoMemory = {
          id: 'mem_video_' + Date.now(),
          title: title,
          imageUrl: videoUrl,
          albumImages: [videoUrl],
          author: {
            name: author,
            role: 'Media Club Producer',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'
          },
          location: location,
          date: 'Just Now',
          category: 'video',
          badgeLabel: 'Video Story',
          badgeIcon: 'bi-play-btn-fill',
          likesCount: 12,
          aspectRatioClass: 'ratio-landscape-16-9',
          description: desc || title,
          tags: ['video', 'VideoStory', category]
        };

        await imageStoreDB.saveMemory(newVideoMemory);

        renderDynamicDataFromDataTS();
        renderAdminSpaceView();
        adminVideoForm.reset();
        showToast(`Video Story "${title}" published to live gallery!`, 'success');
      };
    }

    // 5. Site Config Form Submission
    const siteConfigForm = document.getElementById('admin-site-config-form');
    if (siteConfigForm) {
      siteConfigForm.onsubmit = (e) => {
        e.preventDefault();
        const badge = document.getElementById('adminCfgBadge')?.value;
        const heroTitle = document.getElementById('adminCfgHeroTitle')?.value;
        const heroHighlight = document.getElementById('adminCfgHeroHighlight')?.value;
        const heroSubtitle = document.getElementById('adminCfgHeroSubtitle')?.value;

        const pStat = parseInt(document.getElementById('adminStatPhotos')?.value || '48500', 10);
        const vStat = parseInt(document.getElementById('adminStatVideos')?.value || '1200', 10);
        const eStat = parseInt(document.getElementById('adminStatEvents')?.value || '350', 10);
        const cStat = parseInt(document.getElementById('adminStatContributors')?.value || '850', 10);

        const cfg = {
          archiveBadge: badge,
          heroTitle: heroTitle,
          heroHighlight: heroHighlight,
          heroSubtitle: heroSubtitle,
          overrideStats: { photos: pStat, videos: vStat, events: eStat, contributors: cStat }
        };

        localStorage.setItem('campuslens_site_config_override', JSON.stringify(cfg));
        showToast('Website configuration & live counters updated!', 'success');
        renderDynamicDataFromDataTS();
      };
    }

    // 6. Admin Edit Memory Modal Form Submission
    const adminEditMemoryForm = document.getElementById('admin-edit-memory-form');
    if (adminEditMemoryForm) {
      adminEditMemoryForm.onsubmit = async (e) => {
        e.preventDefault();
        const memId = document.getElementById('editMemoryId')?.value;
        const title = document.getElementById('editMemoryTitle')?.value.trim();
        const category = document.getElementById('editMemoryCategory')?.value;
        const imgUrl = document.getElementById('editMemoryImgUrl')?.value.trim();
        const author = document.getElementById('editMemoryAuthor')?.value.trim();
        const location = document.getElementById('editMemoryLocation')?.value.trim();
        const desc = document.getElementById('editMemoryDesc')?.value.trim();

        // Check if in customMemories
        let customMemories = imageStoreDB.cachedMemories || [];
        const customIdx = customMemories.findIndex(m => String(m.id) === String(memId));
        if (customIdx !== -1) {
          const updatedMem = {
            ...customMemories[customIdx],
            title,
            category,
            imageUrl: imgUrl,
            author: { ...customMemories[customIdx].author, name: author },
            location,
            description: desc
          };
          await imageStoreDB.saveMemory(updatedMem);
        } else {
          // Store in modifiedMemories map
          let modifiedMap = JSON.parse(localStorage.getItem('campuslens_modified_memories') || '{}');
          modifiedMap[memId] = {
            title,
            category,
            imageUrl: imgUrl,
            author: { name: author, role: 'Contributor', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200' },
            location,
            description: desc
          };
          localStorage.setItem('campuslens_modified_memories', JSON.stringify(modifiedMap));
        }

        const modalEl = document.getElementById('adminEditMemoryModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
        }

        renderDynamicDataFromDataTS();
        renderAdminSpaceView();
        showToast(`Memory "${title}" updated successfully!`, 'success');
      };
    }

    // 7. Archive Export & Import Backup System
    const exportBtn = document.getElementById('admin-export-archive-btn');
    if (exportBtn) {
      exportBtn.onclick = async () => {
        try {
          exportBtn.disabled = true;
          exportBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span> Generating Export...`;

          const archiveData = await imageStoreDB.exportFullArchive();
          const dateStr = new Date().toISOString().split('T')[0];
          const filename = `MULens-Archive-${dateStr}.json`;

          const jsonStr = JSON.stringify(archiveData, null, 2);
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          showToast('🟢 Archive exported successfully.', 'success');
        } catch (err) {
          console.error('Error exporting archive:', err);
          showToast('🔴 Failed to export archive file.', 'danger');
        } finally {
          exportBtn.disabled = false;
          exportBtn.innerHTML = `<i class="bi bi-download fs-6"></i> 📤 Export Archive`;
        }
      };
    }

    const importBtn = document.getElementById('admin-import-archive-btn');
    const importFileInput = document.getElementById('admin-import-file-input');

    if (importBtn && importFileInput) {
      importBtn.onclick = () => importFileInput.click();

      importFileInput.onchange = (e) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const text = evt.target.result;
            const archiveData = JSON.parse(text);

            if (!archiveData || typeof archiveData !== 'object' || (archiveData.app !== 'MULens' && !archiveData.media && !archiveData.blobs)) {
              showToast('🔴 Invalid archive file format or corrupted JSON.', 'danger');
              importFileInput.value = '';
              return;
            }

            const modalFilename = document.getElementById('archive-modal-filename');
            const infoVersion = document.getElementById('archive-info-version');
            const infoMedia = document.getElementById('archive-info-media');
            const infoBlobs = document.getElementById('archive-info-blobs');
            const infoUsers = document.getElementById('archive-info-users');

            if (modalFilename) modalFilename.innerText = file.name;
            if (infoVersion) infoVersion.innerText = archiveData.version || '1.0.0';
            if (infoMedia) infoMedia.innerText = (Array.isArray(archiveData.media) ? archiveData.media.length : (Array.isArray(archiveData.memories) ? archiveData.memories.length : 0));
            if (infoBlobs) infoBlobs.innerText = (Array.isArray(archiveData.blobs) ? archiveData.blobs.length : 0);
            if (infoUsers) infoUsers.innerText = (Array.isArray(archiveData.users) ? archiveData.users.length : 0);

            const modalEl = document.getElementById('importArchiveConfirmModal');
            if (modalEl && typeof bootstrap !== 'undefined') {
              const confirmModal = new bootstrap.Modal(modalEl);
              confirmModal.show();

              const confirmBtn = document.getElementById('archive-confirm-import-btn');
              if (confirmBtn) {
                confirmBtn.onclick = async () => {
                  try {
                    confirmBtn.disabled = true;
                    confirmBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Restoring Archive...`;

                    await imageStoreDB.importFullArchive(archiveData);

                    confirmModal.hide();
                    showToast('🟢 Archive imported successfully.', 'success');

                    renderAuthState();
                    renderDynamicDataFromDataTS();
                    renderAdminSpaceView();
                    renderProfileView();
                    renderProfileTabs();
                  } catch (err) {
                    console.error('Error restoring archive:', err);
                    showToast(`🔴 Import failed: ${err.message || 'Corrupted file'}`, 'danger');
                  } finally {
                    confirmBtn.disabled = false;
                    confirmBtn.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Confirm & Import Archive`;
                    importFileInput.value = '';
                  }
                };
              }
            }
          } catch (err) {
            console.error('Error parsing archive JSON:', err);
            showToast('🔴 Invalid archive file format or corrupted JSON.', 'danger');
            importFileInput.value = '';
          }
        };

        reader.onerror = () => {
          showToast('🔴 Error reading selected archive file.', 'danger');
          importFileInput.value = '';
        };

        reader.readAsText(file);
      };
    }

    // 8. Supabase Cloud Sync & Migration Button Listener
    const syncSupabaseBtn = document.getElementById('admin-sync-supabase-btn');
    if (syncSupabaseBtn) {
      const executeMigration = async (adminSecretKey) => {
        try {
          syncSupabaseBtn.disabled = true;
          syncSupabaseBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span> Syncing to Supabase...`;
          showToast('☁️ Starting migration of local IndexedDB data to Supabase Cloud Storage & Database...', 'info');

          const result = await migrateIndexedDBToSupabase((current, total, title) => {
            showToast(`Syncing memory [${current}/${total}]: ${title}`, 'info');
          }, adminSecretKey);

          if (result.success) {
            showToast(`🟢 ${result.message}`, 'success');
            await fetchMemoriesFromSupabase();
            renderDynamicDataFromDataTS();
            renderAdminSpaceView();
            renderProfileView();
            renderProfileTabs();
          } else {
            showToast(`🔴 Migration warning: ${result.message}`, 'danger');
          }
        } catch (err) {
          console.error('[Supabase Migration Error]:', err.message || 'Error occurred');
          showToast(`🔴 Failed to sync data to Supabase: ${err.message || 'Error occurred'}`, 'danger');
        } finally {
          syncSupabaseBtn.disabled = false;
          syncSupabaseBtn.innerHTML = `<i class="bi bi-cloud-upload-fill fs-6"></i> ☁️ Sync Local Data to Supabase`;
        }
      };

      syncSupabaseBtn.onclick = () => {
        const storedSecret = sessionStorage.getItem('mulens_admin_secret');
        const adminModalEl = document.getElementById('adminVerificationModal');
        const secretInput = document.getElementById('adminSecretKeyInput');
        const errorAlert = document.getElementById('adminVerificationError');
        const formEl = document.getElementById('admin-verification-form');
        const submitBtn = document.getElementById('adminVerificationSubmitBtn');

        if (!adminModalEl) {
          executeMigration(storedSecret || '');
          return;
        }

        const modalInstance = (window.bootstrap && bootstrap.Modal)
          ? bootstrap.Modal.getOrCreateInstance(adminModalEl)
          : null;

        if (secretInput) secretInput.value = storedSecret || '';
        if (errorAlert) errorAlert.classList.add('d-none');

        const handleConfirm = async (e) => {
          if (e) e.preventDefault();
          const enteredSecret = secretInput ? secretInput.value.trim() : '';
          if (enteredSecret) {
            sessionStorage.setItem('mulens_admin_secret', enteredSecret);
          }
          if (modalInstance) {
            modalInstance.hide();
          }
          await executeMigration(enteredSecret);
        };

        if (formEl) formEl.onsubmit = handleConfirm;
        if (submitBtn) submitBtn.onclick = handleConfirm;

        if (modalInstance) {
          modalInstance.show();
        } else {
          executeMigration(storedSecret || '');
        }
      };
    }
  }

  // Run initial Auth State rendering, submit trigger binding & Routing on load
  renderAuthState();
  bindSubmitMemoriesTriggers();
  bindAdminEventListeners();
  bindProfileMediaEventListeners();
  bindEventModalActions();
  bindAllEventsModalListeners();
  bindCampusVoicesListeners();
  handleRouting();
});
