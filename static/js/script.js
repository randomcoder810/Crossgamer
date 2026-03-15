// Tournament Highlights Slideshow Manager
class HighlightsSlideshow {
  constructor() {
    this.currentSlide = 0;
    this.slides = [];
    this.totalSlides = 0;
    this.autoPlayInterval = null;
    this.isAutoPlaying = true;
    this.slideInterval = 5000; // 5 seconds
    this.isTransitioning = false;
    this.animationDuration = 800; // 0.8 second animation
    
    // Initialize after a short delay to ensure DOM is ready
    setTimeout(() => this.init(), 100);
  }

  init() {
    this.slides = document.querySelectorAll('.highlights-slide');
    this.totalSlides = this.slides.length;
    
    console.log('Initializing slideshow with', this.totalSlides, 'slides');
    
    if (this.totalSlides === 0) {
      console.warn('No slides found');
      return;
    }
    
    if (this.totalSlides === 1) {
      console.log('Only one slide, skipping navigation');
      return;
    }
    
    this.setupEventListeners();
    this.updateNavigation();
    this.startAutoPlay();
    
    // Add keyboard navigation (only when slideshow is focused)
    document.addEventListener('keydown', (e) => {
      if (document.querySelector('.highlights-slideshow:hover')) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.previousSlide();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.nextSlide();
        }
      }
    });
    
    // Add touch/swipe support
    this.setupTouchSupport();
    
    console.log('Slideshow initialized successfully');
  }

  setupEventListeners() {
    // Navigation buttons
    const prevBtn = document.querySelector('.highlights-nav-btn[data-action="prev"]');
    const nextBtn = document.querySelector('.highlights-nav-btn[data-action="next"]');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.previousSlide();
      });
      console.log('Previous button event listener added');
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.nextSlide();
      });
      console.log('Next button event listener added');
    }
    
    // Dots navigation
    const dots = document.querySelectorAll('.highlight-dot');
    dots.forEach((dot, index) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        this.goToSlide(index);
      });
    });
    console.log('Dot navigation listeners added for', dots.length, 'dots');
    
    // Play buttons - use event delegation for better performance
    const slideshow = document.querySelector('.highlights-slideshow');
    if (slideshow) {
      slideshow.addEventListener('click', (e) => {
        const playButton = e.target.closest('.highlight-play-button, .highlight-watch-btn, .highlight-play-btn');
        if (playButton) {
          e.preventDefault();
          const slide = e.target.closest('.highlights-slide');
          if (slide) {
            this.playVideoFromSlide(slide);
          }
        }
      });
      
      // Pause auto-play on hover
      slideshow.addEventListener('mouseenter', () => this.pauseAutoPlay());
      slideshow.addEventListener('mouseleave', () => this.resumeAutoPlay());
    }
  }

  setupTouchSupport() {
    const slideshow = document.querySelector('.highlights-slideshow');
    if (!slideshow) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    slideshow.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    
    slideshow.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX);
    });
  }

  handleSwipe(startX, endX) {
    const swipeThreshold = 50;
    const diff = startX - endX;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        this.nextSlide(); // Swipe left - next slide
      } else {
        this.previousSlide(); // Swipe right - previous slide
      }
    }
  }

  nextSlide() {
    if (this.isTransitioning || this.totalSlides <= 1) return;
    
    this.isTransitioning = true;
    const oldSlide = this.currentSlide;
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    this.performSlideTransition(oldSlide, this.currentSlide, 'next');
  }

  previousSlide() {
    if (this.isTransitioning || this.totalSlides <= 1) return;
    
    this.isTransitioning = true;
    const oldSlide = this.currentSlide;
    this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
    this.performSlideTransition(oldSlide, this.currentSlide, 'prev');
  }

  goToSlide(index) {
    if (index >= 0 && index < this.totalSlides && index !== this.currentSlide && !this.isTransitioning) {
      this.isTransitioning = true;
      const oldSlide = this.currentSlide;
      this.currentSlide = index;
      const direction = index > oldSlide ? 'next' : 'prev';
      this.performSlideTransition(oldSlide, this.currentSlide, direction);
    }
  }

  performSlideTransition(oldIndex, newIndex, direction) {
    console.log('Transitioning from slide', oldIndex, 'to slide', newIndex);
    
    const oldSlide = this.slides[oldIndex];
    const newSlide = this.slides[newIndex];
    
    if (!newSlide) {
      console.error('New slide not found at index', newIndex);
      this.isTransitioning = false;
      return;
    }
    
    // Close any playing inline video on the old slide
    if (oldSlide) {
      this.closeInlineVideo(oldSlide);
    }
    
    // Hide old slide
    if (oldSlide) {
      oldSlide.classList.remove('active');
      oldSlide.classList.add('slide-out');
    }
    
    // Show new slide immediately
    newSlide.classList.remove('slide-out');
    newSlide.classList.add('active');
    
    // Update navigation immediately
    this.updateNavigation();
    
    // Clean up after animation
    setTimeout(() => {
      if (oldSlide) {
        oldSlide.classList.remove('slide-out');
      }
      this.isTransitioning = false;
      console.log('Transition completed');
    }, this.animationDuration);
  }
  
  updateSlides() {
    this.slides.forEach((slide, index) => {
      slide.classList.remove('active', 'slide-out');
      if (index === this.currentSlide) {
        slide.classList.add('active');
      }
    });
  }

  updateNavigation() {
    // Update dots with smooth animation
    const dots = document.querySelectorAll('.highlight-dot');
    dots.forEach((dot, index) => {
      dot.classList.remove('active');
      if (index === this.currentSlide) {
        dot.classList.add('active');
        // Add ripple effect
        this.addRippleEffect(dot);
      }
    });
    
    // Update navigation buttons (allow infinite loop)
    const prevBtn = document.querySelector('.highlights-nav-btn[data-action="prev"]');
    const nextBtn = document.querySelector('.highlights-nav-btn[data-action="next"]');
    
    if (prevBtn) {
      prevBtn.disabled = this.totalSlides <= 1;
    }
    
    if (nextBtn) {
      nextBtn.disabled = this.totalSlides <= 1;
    }
    
    // Update progress indicator if exists
    this.updateProgressIndicator();
  }
  
  addRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.className = 'dot-ripple';
    element.appendChild(ripple);
    
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.remove();
      }
    }, 600);
  }
  
  updateProgressIndicator() {
    // Create progress bar if it doesn't exist
    let progressBar = document.querySelector('.slideshow-progress');
    if (!progressBar && this.totalSlides > 1) {
      progressBar = document.createElement('div');
      progressBar.className = 'slideshow-progress';
      progressBar.innerHTML = `
        <div class="progress-bar-bg">
          <div class="progress-bar-fill"></div>
        </div>
        <div class="progress-text">${this.currentSlide + 1} / ${this.totalSlides}</div>
      `;
      const slideshow = document.querySelector('.highlights-slideshow');
      if (slideshow) {
        slideshow.appendChild(progressBar);
      }
    }
    
    if (progressBar) {
      const fillBar = progressBar.querySelector('.progress-bar-fill');
      const textEl = progressBar.querySelector('.progress-text');
      if (fillBar) {
        fillBar.style.width = `${((this.currentSlide + 1) / this.totalSlides) * 100}%`;
      }
      if (textEl) {
        textEl.textContent = `${this.currentSlide + 1} / ${this.totalSlides}`;
      }
    }
  }

  playVideoFromSlide(slide) {
    if (!slide) return;
    
    // Ensure only one inline video plays at a time
    try {
      this.closeAllInlineVideos();
    } catch (_) {}
    
    const videoData = {
      id: slide.dataset.videoId || '',
      title: slide.dataset.title || '',
      duration: slide.dataset.duration || '',
      thumbnail: slide.dataset.thumbnail || '',
      embed_id: slide.dataset.embedId || '',
      description: slide.dataset.description || '',
      views: slide.dataset.views || '0',
      created_at: slide.dataset.createdAt || ''
    };
    
    console.log('Playing video inline:', videoData);
    
    if (videoData.embed_id) {
      this.loadInlineVideo(slide, videoData);
    } else {
      console.error('Video embed_id missing', videoData);
    }
  }

  closeAllInlineVideos() {
    if (!this.slides || this.slides.length === 0) return;
    this.slides.forEach(s => {
      const playerContainer = s.querySelector('.highlight-video-player');
      if (playerContainer && playerContainer.style.display === 'block') {
        this.closeInlineVideo(s);
      }
    });
  }
  
  loadInlineVideo(slide, videoData) {
    const videoContainer = slide.querySelector('.highlight-video-container');
    const thumbnail = slide.querySelector('.highlight-video-thumbnail');
    const playerContainer = slide.querySelector('.highlight-video-player');
    const playButton = slide.querySelector('.highlight-play-button');
    const overlay = slide.querySelector('.highlight-video-overlay');
    
    if (!videoContainer || !thumbnail || !playerContainer) {
      console.error('Required video elements not found');
      return;
    }
    
    // Hide thumbnail and play button
    thumbnail.style.display = 'none';
    if (playButton) playButton.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    
    // Show video player container
    playerContainer.style.display = 'block';
    
    // Create YouTube iframe
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoData.embed_id}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameborder = '0';
    iframe.allowfullscreen = true;
    iframe.allow = 'autoplay; fullscreen';
    iframe.className = 'highlight-youtube-player';
    
    // Clear any existing content and add iframe
    playerContainer.innerHTML = '';
    playerContainer.appendChild(iframe);
    
    // Add close button to return to thumbnail
    const closeButton = document.createElement('button');
    closeButton.className = 'highlight-close-btn';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.title = 'Close Video';
    closeButton.onclick = () => this.closeInlineVideo(slide);
    playerContainer.appendChild(closeButton);
    
    // Pause auto-play while video is playing
    this.pauseAutoPlay();

    // Setup mini-player on scroll for this slide
    try {
      this.enableMiniOnScroll(slide);
    } catch (e) {
      console.warn('Mini-player setup failed', e);
    }
    
    // Count view
    try {
      const tokenKey = `video_viewed_${videoData.id}`;
      if (!localStorage.getItem(tokenKey)) {
        fetch(`/api/video/${encodeURIComponent(videoData.id)}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).then(r => r.json()).then(res => {
          if (res && res.success) {
            localStorage.setItem(tokenKey, '1');
          }
        }).catch(() => {});
      }
    } catch (_) {}
    
    console.log('Inline video loaded successfully');
  }
  
  enableMiniOnScroll(slide) {
    // Disconnect previous observer if any
    if (slide._miniObserver) {
      try { slide._miniObserver.disconnect(); } catch (_) {}
    }
    const playerContainer = slide.querySelector('.highlight-video-player');
    if (!playerContainer) return;
    
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      // Only minimize when player is visible (playing) but scrolled mostly out of view
      const isPlayingVisible = playerContainer.style.display === 'block';
      if (!isPlayingVisible) {
        playerContainer.classList.remove('minimized');
        return;
      }
      if (entry && entry.isIntersecting) {
        // In view, restore
        playerContainer.classList.remove('minimized');
      } else {
        // Out of view, minimize to corner
        playerContainer.classList.add('minimized');
      }
    }, { threshold: 0.25 });
    
    observer.observe(playerContainer);
    slide._miniObserver = observer;
  }
  
  closeInlineVideo(slide) {
    const thumbnail = slide.querySelector('.highlight-video-thumbnail');
    const playerContainer = slide.querySelector('.highlight-video-player');
    const playButton = slide.querySelector('.highlight-play-button');
    const overlay = slide.querySelector('.highlight-video-overlay');
    
    // Hide video player
    if (playerContainer) {
      playerContainer.style.display = 'none';
      playerContainer.innerHTML = '';
      playerContainer.classList.remove('minimized');
    }
    // Disconnect mini observer
    if (slide && slide._miniObserver) {
      try { slide._miniObserver.disconnect(); } catch (_) {}
      slide._miniObserver = null;
    }
    
    // Show thumbnail and controls
    if (thumbnail) thumbnail.style.display = 'block';
    if (playButton) playButton.style.display = 'flex';
    if (overlay) overlay.style.display = 'block';
    
    // Resume auto-play
    this.resumeAutoPlay();
    
    console.log('Inline video closed');
  }

  startAutoPlay() {
    if (this.totalSlides <= 1) return;
    
    console.log('Starting auto-play');
    
    // Create autoplay indicator
    this.createAutoplayIndicator();
    
    // Clear any existing interval
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
    
    this.autoPlayInterval = setInterval(() => {
      if (this.isAutoPlaying && !this.isTransitioning) {
        this.nextSlide();
        this.updateAutoplayIndicator();
      }
    }, this.slideInterval);
  }
  
  createAutoplayIndicator() {
    const existing = document.querySelector('.highlights-autoplay');
    if (existing) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'highlights-autoplay';
    indicator.innerHTML = `
      <i class="fas fa-play"></i>
      <span>Auto-play</span>
      <div class="autoplay-progress">
        <div class="autoplay-progress-fill"></div>
      </div>
    `;
    
    const slideshow = document.querySelector('.highlights-slideshow');
    if (slideshow) {
      slideshow.appendChild(indicator);
    }
  }
  
  updateAutoplayIndicator() {
    const progressFill = document.querySelector('.autoplay-progress-fill');
    if (progressFill && this.isAutoPlaying) {
      progressFill.style.animation = 'none';
      progressFill.style.width = '0%';
    // Use requestAnimationFrame for smoother animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          progressFill.style.animation = `autoplayProgress ${this.slideInterval}ms linear`;
          progressFill.style.width = '100%';
        });
      });
    }
  }

  pauseAutoPlay() {
    this.isAutoPlaying = false;
  }

  resumeAutoPlay() {
    this.isAutoPlaying = true;
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  destroy() {
    this.stopAutoPlay();
  }
}

// Initialize highlights slideshow when DOM is loaded
let highlightsSlideshow = null;

// Ensure only one slideshow instance
function initializeSlideshow() {
  if (highlightsSlideshow) {
    highlightsSlideshow.destroy();
  }
  
  const slidesExist = document.querySelector('.highlights-slide');
  if (slidesExist) {
    highlightsSlideshow = new HighlightsSlideshow();
  }
}


// Enhanced Video Player Class
class EnhancedVideoPlayer {
  constructor(containerId, videoData) {
    this.container = document.getElementById(containerId);
    this.videoData = videoData;
    this.isPlaying = false;
    this.isFullscreen = false;
    this.currentVolume = 1;
    this.isMuted = false;
    this.currentQuality = 'auto';
    this.isLoading = false;
    this.hasError = false;
    this.player = null;
    
    console.log('EnhancedVideoPlayer initialized with:', videoData);
    this.init();
  }

  init() {
    try {
      this.createPlayerHTML();
      this.bindEvents();
      this.setupKeyboardControls();
      this.setupTouchControls();
      console.log('EnhancedVideoPlayer initialized successfully');
    } catch (error) {
      console.error('Error initializing EnhancedVideoPlayer:', error);
    }
  }

  createPlayerHTML() {
    try {
      this.container.innerHTML = `
        <div class="video-player-container" id="video-player-${this.videoData.id}">
          <!-- Loading State -->
          <div class="video-loading" id="loading-${this.videoData.id}">
            <div class="video-loading-spinner"></div>
            <div>Loading video...</div>
          </div>

          <!-- Error State -->
          <div class="video-error" id="error-${this.videoData.id}" style="display: none;">
            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
            <div>Failed to load video</div>
            <button class="btn btn-warning mt-3" onclick="videoPlayer.retryLoad()">
              <i class="fas fa-redo me-2"></i>Retry
            </button>
          </div>

          <!-- Video Info Overlay -->
          <div class="video-info-overlay">
            <div class="video-title">${this.videoData.title}</div>
            <div class="video-meta-info">
              <span><i class="fas fa-eye me-1"></i>${this.videoData.views} views</span>
              <span><i class="fas fa-clock me-1"></i>${this.videoData.duration}</span>
              <span><i class="fas fa-calendar me-1"></i>${this.formatDate(this.videoData.created_at)}</span>
            </div>
          </div>

          <!-- Video Controls Overlay -->
          <div class="video-controls-overlay">
            <div class="video-controls">
              <div class="video-controls-left">
                <button class="video-control-btn primary" id="play-pause-${this.videoData.id}" title="Play/Pause">
                  <i class="fas fa-play"></i>
                </button>
                <div class="video-volume">
                  <button class="video-control-btn" id="mute-${this.videoData.id}" title="Mute/Unmute">
                    <i class="fas fa-volume-up"></i>
                  </button>
                  <div class="video-volume-slider" id="volume-slider-${this.videoData.id}">
                    <div class="video-volume-bar" id="volume-bar-${this.videoData.id}" style="width: 100%"></div>
                  </div>
                </div>
              </div>

              <div class="video-progress" id="progress-${this.videoData.id}">
                <div class="video-progress-bar" id="progress-bar-${this.videoData.id}" style="width: 0%"></div>
              </div>

              <div class="video-controls-right">
                <button class="video-control-btn" id="quality-${this.videoData.id}" title="Quality">
                  <i class="fas fa-cog"></i>
                </button>
                <button class="video-control-btn" id="fullscreen-${this.videoData.id}" title="Fullscreen">
                  <i class="fas fa-expand"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Quality Menu -->
          <div class="video-quality-menu" id="quality-menu-${this.videoData.id}">
            <div class="video-quality-option active" data-quality="auto">Auto</div>
            <div class="video-quality-option" data-quality="1080p">1080p</div>
            <div class="video-quality-option" data-quality="720p">720p</div>
            <div class="video-quality-option" data-quality="480p">480p</div>
          </div>

          <!-- YouTube player will be inserted here by the API -->
        </div>
      `;
      console.log('Video player HTML created successfully');
    } catch (error) {
      console.error('Error creating player HTML:', error);
    }
  }

  bindEvents() {
    try {
      // Play/Pause button
      const playPauseBtn = document.getElementById(`play-pause-${this.videoData.id}`);
      if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => this.togglePlayPause());
      }

      // Mute button
      const muteBtn = document.getElementById(`mute-${this.videoData.id}`);
      if (muteBtn) {
        muteBtn.addEventListener('click', () => this.toggleMute());
      }

      // Volume slider
      const volumeSlider = document.getElementById(`volume-slider-${this.videoData.id}`);
      if (volumeSlider) {
        volumeSlider.addEventListener('click', (e) => this.setVolume(e));
      }

      // Progress bar
      const progressBar = document.getElementById(`progress-${this.videoData.id}`);
      if (progressBar) {
        progressBar.addEventListener('click', (e) => this.seekTo(e));
      }

      // Fullscreen button
      const fullscreenBtn = document.getElementById(`fullscreen-${this.videoData.id}`);
      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
      }

      // Quality button
      const qualityBtn = document.getElementById(`quality-${this.videoData.id}`);
      if (qualityBtn) {
        qualityBtn.addEventListener('click', () => this.toggleQualityMenu());
      }

      // Quality options
      const qualityOptions = document.querySelectorAll(`#quality-menu-${this.videoData.id} .video-quality-option`);
      qualityOptions.forEach(option => {
        option.addEventListener('click', (e) => this.changeQuality(e.target.dataset.quality));
      });

      // Hide quality menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest(`#quality-menu-${this.videoData.id}`) && 
            !e.target.closest(`#quality-${this.videoData.id}`)) {
          this.hideQualityMenu();
        }
      });

      // Fullscreen change event listeners
      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
          this.isFullscreen = false;
          this.updateFullscreenButton();
        }
      });

      document.addEventListener('webkitfullscreenchange', () => {
        if (!document.webkitFullscreenElement) {
          this.isFullscreen = false;
          this.updateFullscreenButton();
        }
      });

      document.addEventListener('mozfullscreenchange', () => {
        if (!document.mozFullScreenElement) {
          this.isFullscreen = false;
          this.updateFullscreenButton();
        }
      });

      document.addEventListener('MSFullscreenChange', () => {
        if (!document.msFullscreenElement) {
          this.isFullscreen = false;
          this.updateFullscreenButton();
        }
      });

      console.log('Video player events bound successfully');
    } catch (error) {
      console.error('Error binding events:', error);
    }
  }

  setupKeyboardControls() {
    try {
      document.addEventListener('keydown', (e) => {
        if (!this.container.contains(document.activeElement)) return;

        switch(e.key) {
          case ' ':
            e.preventDefault();
            this.togglePlayPause();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            this.seek(-10);
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.seek(10);
            break;
          case 'ArrowUp':
            e.preventDefault();
            this.changeVolume(0.1);
            break;
          case 'ArrowDown':
            e.preventDefault();
            this.changeVolume(-0.1);
            break;
          case 'm':
          case 'M':
            e.preventDefault();
            this.toggleMute();
            break;
          case 'f':
          case 'F':
            e.preventDefault();
            this.toggleFullscreen();
            break;
          case 'Escape':
            if (this.isFullscreen) {
              this.exitFullscreen();
            }
            break;
        }
      });
      console.log('Keyboard controls setup successfully');
    } catch (error) {
      console.error('Error setting up keyboard controls:', error);
    }
  }

  setupTouchControls() {
    try {
      let touchStartTime = 0;
      let touchStartX = 0;
      let touchStartY = 0;

      this.container.addEventListener('touchstart', (e) => {
        touchStartTime = Date.now();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      });

      this.container.addEventListener('touchend', (e) => {
        const touchEndTime = Date.now();
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const touchDuration = touchEndTime - touchStartTime;
        const touchDistance = Math.sqrt(
          Math.pow(touchEndX - touchStartX, 2) + 
          Math.pow(touchEndY - touchStartY, 2)
        );

        // Single tap (short duration, small distance)
        if (touchDuration < 300 && touchDistance < 50) {
          this.togglePlayPause();
        }
      });
      console.log('Touch controls setup successfully');
    } catch (error) {
      console.error('Error setting up touch controls:', error);
    }
  }

  loadVideo() {
    try {
      console.log('Loading video:', this.videoData.embed_id);
      this.showLoading();
      this.hideError();

      // Load YouTube API if not already loaded
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      // Initialize player when API is ready
      if (window.YT && window.YT.Player) {
        this.initializePlayer();
      } else {
        window.onYouTubeIframeAPIReady = () => {
          this.initializePlayer();
        };
      }
    } catch (error) {
      console.error('Error loading video:', error);
      this.showError();
    }
  }

  initializePlayer() {
    try {
      const container = document.getElementById(`video-player-${this.videoData.id}`);
      if (!container) {
        console.error('Player container not found');
        this.showError();
        return;
      }

      // Create player element
      const playerElement = document.createElement('div');
      playerElement.id = `youtube-player-${this.videoData.id}`;
      container.appendChild(playerElement);

      // Initialize YouTube player with enhanced settings
      this.player = new YT.Player(`youtube-player-${this.videoData.id}`, {
        height: '100%',
        width: '100%',
        videoId: this.videoData.embed_id,
        playerVars: {
          autoplay: 1,
          mute: this.isMuted ? 1 : 0,
          controls: 0,
          disablekb: 0,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          vq: this.getQualityParam()
        },
        events: {
          onReady: (event) => {
            console.log('YouTube player ready');
            this.hideLoading();
            // Ensure sound is ON by default after a user interaction
            this.isMuted = false;
            if (event.target.unMute) {
              try { event.target.unMute(); } catch (e) { /* noop */ }
            }
            this.currentVolume = 1;
            this.isPlaying = true;
            this.updatePlayPauseButton();
            this.updateMuteButton();
            this.updateVolumeDisplay();
            
            // Set initial volume to 100%
            if (event.target.setVolume) {
              try { event.target.setVolume(100); } catch (e) { /* noop */ }
            }
            
            // Start progress updates
            this.startProgressUpdate();
            
            // Adjust video player height after loading
            setTimeout(() => {
              adjustVideoPlayerHeight();
            }, 100);
          },
          onStateChange: (event) => {
            // Update play/pause state based on YouTube player state
            if (event.data === YT.PlayerState.PLAYING) {
              this.isPlaying = true;
              this.updatePlayPauseButton();
            } else if (event.data === YT.PlayerState.PAUSED) {
              this.isPlaying = false;
              this.updatePlayPauseButton();
            }
          },
          onError: (event) => {
            console.error('YouTube player error:', event.data);
            this.showError();
          }
        }
      });
    } catch (error) {
      console.error('Error initializing player:', error);
      this.showError();
    }
  }

  togglePlayPause() {
    console.log('Toggle play/pause called');
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    console.log('Play called');
    if (this.player && this.player.playVideo) {
      this.player.playVideo();
    }
    this.isPlaying = true;
    this.updatePlayPauseButton();
  }

  pause() {
    console.log('Pause called');
    if (this.player && this.player.pauseVideo) {
      this.player.pauseVideo();
    }
    this.isPlaying = false;
    this.updatePlayPauseButton();
  }

  toggleMute() {
    if (this.player && this.player.isMuted) {
      if (this.player.unMute) {
        this.player.unMute();
      }
      this.isMuted = false;
    } else {
      if (this.player && this.player.mute) {
        this.player.mute();
      }
      this.isMuted = true;
    }
    this.updateMuteButton();
    this.updateVolumeDisplay();
  }

  setVolume(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const volume = Math.max(0, Math.min(1, clickX / rect.width));
    
    this.currentVolume = volume;
    this.isMuted = volume === 0;
    
    if (this.player && this.player.setVolume) {
      this.player.setVolume(volume * 100);
    }
    
    this.updateVolumeDisplay();
    this.updateMuteButton();
  }

  changeVolume(delta) {
    this.currentVolume = Math.max(0, Math.min(1, this.currentVolume + delta));
    this.isMuted = this.currentVolume === 0;
    
    if (this.player && this.player.setVolume) {
      this.player.setVolume(this.currentVolume * 100);
    }
    
    this.updateVolumeDisplay();
    this.updateMuteButton();
  }

  seekTo(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekPercent = clickX / rect.width;
    
    if (this.player && this.player.getDuration) {
      const duration = this.player.getDuration();
      const seekTime = duration * seekPercent;
      if (this.player.seekTo) {
        this.player.seekTo(seekTime, true);
      }
    }
    
    this.updateProgressBar(seekPercent * 100);
  }

  seek(seconds) {
    if (this.player && this.player.getCurrentTime) {
      const currentTime = this.player.getCurrentTime();
      const newTime = currentTime + seconds;
      if (this.player.seekTo) {
        this.player.seekTo(newTime, true);
      }
    }
    console.log(`Seeking ${seconds} seconds`);
  }

  toggleFullscreen() {
    if (this.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  enterFullscreen() {
    const container = document.getElementById(`video-player-${this.videoData.id}`);
    
    // Use the Fullscreen API for true fullscreen
    if (container.requestFullscreen) {
      container.requestFullscreen().then(() => {
        this.isFullscreen = true;
        this.updateFullscreenButton();
      }).catch(err => {
        console.error('Error entering fullscreen:', err);
        // Fallback to CSS fullscreen
        container.classList.add('fullscreen');
        this.isFullscreen = true;
        this.updateFullscreenButton();
      });
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen().then(() => {
        this.isFullscreen = true;
        this.updateFullscreenButton();
      }).catch(err => {
        console.error('Error entering fullscreen:', err);
        // Fallback to CSS fullscreen
        container.classList.add('fullscreen');
        this.isFullscreen = true;
        this.updateFullscreenButton();
      });
    } else if (container.msRequestFullscreen) {
      container.msRequestFullscreen().then(() => {
        this.isFullscreen = true;
        this.updateFullscreenButton();
      }).catch(err => {
        console.error('Error entering fullscreen:', err);
        // Fallback to CSS fullscreen
        container.classList.add('fullscreen');
        this.isFullscreen = true;
        this.updateFullscreenButton();
      });
    } else {
      // Fallback to CSS fullscreen
      container.classList.add('fullscreen');
      this.isFullscreen = true;
      this.updateFullscreenButton();
    }
  }

  exitFullscreen() {
    const container = document.getElementById(`video-player-${this.videoData.id}`);
    
    // Use the Fullscreen API to exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        this.isFullscreen = false;
        this.updateFullscreenButton();
      }).catch(err => {
        console.error('Error exiting fullscreen:', err);
        // Fallback to CSS fullscreen
        container.classList.remove('fullscreen');
        this.isFullscreen = false;
        this.updateFullscreenButton();
      });
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen().then(() => {
        this.isFullscreen = false;
        this.updateFullscreenButton();
      }).catch(err => {
        console.error('Error exiting fullscreen:', err);
        // Fallback to CSS fullscreen
        container.classList.remove('fullscreen');
        this.isFullscreen = false;
        this.updateFullscreenButton();
      });
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen().then(() => {
        this.isFullscreen = false;
        this.updateFullscreenButton();
      }).catch(err => {
        console.error('Error exiting fullscreen:', err);
        // Fallback to CSS fullscreen
        container.classList.remove('fullscreen');
        this.isFullscreen = false;
        this.updateFullscreenButton();
      });
    } else {
      // Fallback to CSS fullscreen
      container.classList.remove('fullscreen');
      this.isFullscreen = false;
      this.updateFullscreenButton();
    }
  }

  toggleQualityMenu() {
    const menu = document.getElementById(`quality-menu-${this.videoData.id}`);
    menu.classList.toggle('show');
  }

  hideQualityMenu() {
    const menu = document.getElementById(`quality-menu-${this.videoData.id}`);
    menu.classList.remove('show');
  }

  changeQuality(quality) {
    this.currentQuality = quality;
    this.updateQualityButton();
    this.hideQualityMenu();
    
    // Update active quality option
    const options = document.querySelectorAll(`#quality-menu-${this.videoData.id} .video-quality-option`);
    options.forEach(option => {
      option.classList.remove('active');
      if (option.dataset.quality === quality) {
        option.classList.add('active');
      }
    });
  }

  getQualityParam() {
    switch(this.currentQuality) {
      case '1080p': return 'hd1080';
      case '720p': return 'hd720';
      case '480p': return 'large';
      default: return 'auto';
    }
  }

  showLoading() {
    this.isLoading = true;
    const loadingElement = document.getElementById(`loading-${this.videoData.id}`);
    if (loadingElement) {
      loadingElement.style.display = 'flex';
    }
  }

  hideLoading() {
    this.isLoading = false;
    const loadingElement = document.getElementById(`loading-${this.videoData.id}`);
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }

  showError() {
    this.hasError = true;
    const errorElement = document.getElementById(`error-${this.videoData.id}`);
    if (errorElement) {
      errorElement.style.display = 'flex';
    }
  }

  hideError() {
    this.hasError = false;
    const errorElement = document.getElementById(`error-${this.videoData.id}`);
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  retryLoad() {
    this.loadVideo();
  }

  updatePlayPauseButton() {
    const btn = document.getElementById(`play-pause-${this.videoData.id}`);
    if (!btn) return;
    
    const icon = btn.querySelector('i');
    
    if (this.isPlaying) {
      icon.className = 'fas fa-pause';
      btn.title = 'Pause';
    } else {
      icon.className = 'fas fa-play';
      btn.title = 'Play';
    }
  }

  updateMuteButton() {
    const btn = document.getElementById(`mute-${this.videoData.id}`);
    if (!btn) return;
    
    const icon = btn.querySelector('i');
    
    if (this.isMuted || this.currentVolume === 0) {
      icon.className = 'fas fa-volume-mute';
      btn.title = 'Unmute';
    } else if (this.currentVolume < 0.5) {
      icon.className = 'fas fa-volume-down';
      btn.title = 'Mute';
    } else {
      icon.className = 'fas fa-volume-up';
      btn.title = 'Mute';
    }
  }

  updateVolumeDisplay() {
    const volumeBar = document.getElementById(`volume-bar-${this.videoData.id}`);
    if (volumeBar) {
      volumeBar.style.width = `${this.currentVolume * 100}%`;
    }
  }

  updateProgressBar(percent) {
    const progressBar = document.getElementById(`progress-bar-${this.videoData.id}`);
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }
  }

  updateFullscreenButton() {
    const btn = document.getElementById(`fullscreen-${this.videoData.id}`);
    if (!btn) return;
    
    const icon = btn.querySelector('i');
    
    if (this.isFullscreen) {
      icon.className = 'fas fa-compress';
      btn.title = 'Exit Fullscreen';
    } else {
      icon.className = 'fas fa-expand';
      btn.title = 'Fullscreen';
    }
  }

  updateQualityButton() {
    const btn = document.getElementById(`quality-${this.videoData.id}`);
    if (btn) {
      btn.title = `Quality: ${this.currentQuality}`;
    }
  }

  updateProgress() {
    if (this.player && this.player.getCurrentTime && this.player.getDuration) {
      const currentTime = this.player.getCurrentTime();
      const duration = this.player.getDuration();
      if (duration > 0) {
        const progress = (currentTime / duration) * 100;
        this.updateProgressBar(progress);
      }
    }
  }

  startProgressUpdate() {
    this.progressInterval = setInterval(() => {
      this.updateProgress();
    }, 1000);
  }

  stopProgressUpdate() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  destroy() {
    this.stopProgressUpdate();
    if (this.player && this.player.destroy) {
      this.player.destroy();
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
}

// Global video player instance
let videoPlayer = null;

// Responsive video player height utility
function adjustVideoPlayerHeight() {
  const videoContainers = document.querySelectorAll('.video-player-container, .enhanced-video-player');
  videoContainers.forEach(container => {
    const iframe = container.querySelector('iframe');
    if (iframe) {
      const containerWidth = container.offsetWidth;
      // Maintain 16:9 aspect ratio with minimum height constraints
      const calculatedHeight = Math.max((containerWidth / 16) * 9, 300);
      
      if (window.innerWidth >= 1200) {
        iframe.style.height = Math.max(calculatedHeight, 600) + 'px';
      } else if (window.innerWidth >= 992) {
        iframe.style.height = Math.max(calculatedHeight, 500) + 'px';
      } else if (window.innerWidth >= 768) {
        iframe.style.height = Math.max(calculatedHeight, 400) + 'px';
      } else {
        iframe.style.height = Math.max(calculatedHeight, 300) + 'px';
      }
    }
  });
}

// Call on window resize
window.addEventListener('resize', adjustVideoPlayerHeight);
window.addEventListener('orientationchange', adjustVideoPlayerHeight);

// Enhanced video loading function
function loadEnhancedVideo(videoData) {
  console.log('loadEnhancedVideo called with:', videoData);
  console.log('Button click detected!');
  
  try {
    // Show the enhanced video container
    const container = document.getElementById('enhanced-video-container');
    if (!container) {
      console.error('Enhanced video container not found');
      return;
    }
    
    container.style.display = 'block';
    
    // Scroll to the video player
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Create and load the enhanced video player
    if (window.videoPlayer) {
      // Clean up existing player
      window.videoPlayer.destroy();
      window.videoPlayer.container.innerHTML = '';
    }
    
    // Create new enhanced video player
    window.videoPlayer = new EnhancedVideoPlayer('enhanced-video-container', videoData);
    window.videoPlayer.loadVideo();
    
    // Add visual feedback for the clicked video
    highlightSelectedVideo(videoData.id);
    
    console.log('Enhanced video player created and loaded');

    // Count view once per browser per video using localStorage token
    try {
      const tokenKey = `video_viewed_${videoData.id}`;
      if (!localStorage.getItem(tokenKey)) {
        fetch(`/api/video/${encodeURIComponent(videoData.id)}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).then(r => r.json()).then(res => {
          if (res && res.success) {
            localStorage.setItem(tokenKey, '1');
          }
        }).catch(() => {});
      }
    } catch (_) {}

    // Show full description below the player if available (collapsible)
    try {
      const desc = document.getElementById('video-description');
      if (desc) {
        if (videoData.description && videoData.description.length > 0) {
          const safe = (videoData.description + '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          desc.innerHTML = `
            <div class="card">
              <div class="card-body">
                <h6 class="mb-2"><i class=\"fas fa-info-circle me-2\"></i>Description</h6>
                <div class="desc-wrapper">
                  <div id="desc-content" class="text-muted desc-content desc-collapsed">${safe}</div>
                </div>
                <button id="desc-toggle" class="btn btn-sm btn-outline-secondary mt-2">Show more</button>
              </div>
            </div>`;
          desc.style.display = 'block';

          const toggleBtn = document.getElementById('desc-toggle');
          const contentEl = document.getElementById('desc-content');
          if (toggleBtn && contentEl) {
            toggleBtn.addEventListener('click', function() {
              const expanded = contentEl.classList.contains('desc-expanded');
              if (expanded) {
                contentEl.classList.remove('desc-expanded');
                contentEl.classList.add('desc-collapsed');
                toggleBtn.textContent = 'Show more';
              } else {
                contentEl.classList.remove('desc-collapsed');
                contentEl.classList.add('desc-expanded');
                toggleBtn.textContent = 'Show less';
              }
            });
          }
        } else {
          desc.style.display = 'none';
          desc.innerHTML = '';
        }
      }
    } catch (e) {
      console.warn('Failed to render description', e);
    }
  } catch (error) {
    console.error('Error loading enhanced video:', error);
  }
}

// Function to highlight the selected video
function highlightSelectedVideo(videoId) {
  // Remove previous highlights
  document.querySelectorAll('.video-card-enhanced').forEach(card => {
    card.classList.remove('selected-video');
  });
  
  // Add highlight to selected video
  const selectedCard = document.querySelector(`[data-video-id="${videoId}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected-video');
  }
}

// Form validation functions
function validateRegistrationForm() {
  const submitBtn = document.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  // Show loading state
  submitBtn.innerHTML = '<span class="loading"></span> Validating...';
  submitBtn.disabled = true;
  
  // Validate team name
  const teamName = document.getElementById('team_name').value.trim();
  if (teamName.length < 3) {
    showError('Team name must be at least 3 characters long.');
    resetButton(submitBtn, originalText);
    return false;
  }

  // Validate all player names
  for (let i = 1; i <= 4; i++) {
    const playerName = document.getElementById(`player${i}`).value.trim();
    if (playerName.length < 2) {
      showError(`Player ${i} name must be at least 2 characters long.`);
      resetButton(submitBtn, originalText);
      return false;
    }
  }

  // Validate email
  const email = document.getElementById('email').value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email address.');
    resetButton(submitBtn, originalText);
    return false;
  }

  // Validate phone number (10 digits)
  const phone = document.getElementById('phone').value.trim();
  if (!/^\d{10}$/.test(phone)) {
    showError('Please enter a valid 10-digit phone number.');
    resetButton(submitBtn, originalText);
    return false;
  }

  // All validations passed
  submitBtn.innerHTML = '<span class="loading"></span> Submitting...';
  return true;
}

function validateContactForm() {
  const submitBtn = document.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  // Show loading state
  submitBtn.innerHTML = '<span class="loading"></span> Sending...';
  submitBtn.disabled = true;

  // Validate name
  const name = document.getElementById('name').value.trim();
  if (name.length < 2) {
    showError('Name must be at least 2 characters long.');
    resetButton(submitBtn, originalText);
    return false;
  }

  // Validate email
  const email = document.getElementById('email').value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email address.');
    resetButton(submitBtn, originalText);
    return false;
  }

  // Validate message length
  const msg = document.getElementById('message').value.trim();
  if (msg.length < 10) {
    showError('Message should be at least 10 characters long.');
    resetButton(submitBtn, originalText);
    return false;
  }

  // All validations passed
  submitBtn.innerHTML = '<span class="loading"></span> Sending...';
  return true;
}

// Utility functions
function showError(message) {
  // Create a custom error alert
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show';
  alertDiv.innerHTML = `
    <i class="fas fa-exclamation-triangle me-2"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  // Insert at the top of the container
  const container = document.querySelector('.container');
  container.insertBefore(alertDiv, container.firstChild);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}

function resetButton(button, originalText) {
  button.innerHTML = originalText;
  button.disabled = false;
}

// Real-time validation
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing slideshow and video player');
  
  // Initialize highlights slideshow with delay
  setTimeout(initializeSlideshow, 200);
  
  // Phone number formatting
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 10) {
        value = value.slice(0, 10);
      }
      e.target.value = value;
    });
  }

  // Real-time email validation
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', function() {
      const email = this.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (email && !emailRegex.test(email)) {
        this.classList.add('is-invalid');
        showFieldError(this, 'Please enter a valid email address.');
      } else {
        this.classList.remove('is-invalid');
        removeFieldError(this);
      }
    });
  });

  // Real-time team name validation
  const teamNameInput = document.getElementById('team_name');
  if (teamNameInput) {
    teamNameInput.addEventListener('input', function() {
      const value = this.value.trim();
      if (value.length > 0 && value.length < 3) {
        this.classList.add('is-invalid');
        showFieldError(this, 'Team name must be at least 3 characters long.');
      } else {
        this.classList.remove('is-invalid');
        removeFieldError(this);
      }
    });
  }

  // Real-time player name validation
  for (let i = 1; i <= 4; i++) {
    const playerInput = document.getElementById(`player${i}`);
    if (playerInput) {
      playerInput.addEventListener('input', function() {
        const value = this.value.trim();
        if (value.length > 0 && value.length < 2) {
          this.classList.add('is-invalid');
          showFieldError(this, 'Player name must be at least 2 characters long.');
        } else {
          this.classList.remove('is-invalid');
          removeFieldError(this);
        }
      });
    }
  }
});

// One-time permission request for better experience
document.addEventListener('DOMContentLoaded', function() {
  try {
    const PERM_FLAG = 'bgmi_perms_requested_v1';
    if (!localStorage.getItem(PERM_FLAG)) {
      // Request Notification permission
      if (window.Notification && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }

      // Request geolocation permission (prompt user)
      if (navigator.geolocation && !('permissions' in navigator)) {
        navigator.geolocation.getCurrentPosition(function() {}, function() {});
      } else if (navigator.permissions && navigator.geolocation) {
        navigator.permissions.query({ name: 'geolocation' }).then(function(status) {
          if (status.state === 'prompt') {
            navigator.geolocation.getCurrentPosition(function() {}, function() {});
          }
        }).catch(() => {});
      }

      // Mark as requested so we don't spam
      localStorage.setItem(PERM_FLAG, '1');
    }
  } catch (_) {}
});

function showFieldError(input, message) {
  // Remove existing error
  removeFieldError(input);
  
  // Create error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'invalid-feedback';
  errorDiv.textContent = message;
  
  // Insert after input
  input.parentNode.appendChild(errorDiv);
}

function removeFieldError(input) {
  const existingError = input.parentNode.querySelector('.invalid-feedback');
  if (existingError) {
    existingError.remove();
  }
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Add animation classes on scroll
function animateOnScroll() {
  const elements = document.querySelectorAll('.card, .stats-card, .btn');
  elements.forEach(element => {
    const elementTop = element.getBoundingClientRect().top;
    const elementVisible = 150;
    
    if (elementTop < window.innerHeight - elementVisible) {
      element.classList.add('animate__animated', 'animate__fadeInUp');
    }
  });
}

// Initialize animations
window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load', animateOnScroll);

// Form submission enhancement
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      // Add a small delay to show loading state
      setTimeout(() => {
        // Form will submit normally
      }, 100);
    });
  });
});

// Auto-hide alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      if (alert.parentNode) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    }, 5000);
  });
});

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
  // Add hover effects to cards
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });

  // Add click effects to buttons
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      // Create ripple effect
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
  .btn {
    position: relative;
    overflow: hidden;
  }
  
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .animate__animated {
    animation-duration: 0.6s;
  }
  
  .animate__fadeInUp {
    animation-name: fadeInUp;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate3d(0, 40px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
`;
document.head.appendChild(style);
