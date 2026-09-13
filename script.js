(() => {
  const TOTAL_FRAMES = 240;
  const FOLDER_PATH = 'ezgif-4bb4f0488ebc4c9a-jpg';
  const LERP_FACTOR = 0.08; // Buttery smooth inertia damping

  const canvas = document.getElementById('animation-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const header = document.querySelector('.header');

  const images = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let targetFrame = 0;
  let currentFrame = 0;
  let lastDrawnIndex = -1;
  let isTicking = false;

  // Generate frame file path
  function getFrameUrl(index) {
    const frameNum = String(index + 1).padStart(3, '0');
    return `${FOLDER_PATH}/ezgif-frame-${frameNum}.jpg`;
  }

  // Cover-fit image on canvas maintaining aspect ratio
  function drawImageCover(img) {
    if (!img || !img.naturalWidth) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;

    const offsetX = (canvasWidth - scaledWidth) * 0.5;
    const offsetY = (canvasHeight - scaledHeight) * 0.5;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
  }

  // Find the closest loaded frame to avoid any missing frame or flicker
  function getBestAvailableFrame(index) {
    if (images[index] && images[index].complete && images[index].naturalWidth > 0) {
      return images[index];
    }
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = index - offset;
      if (prev >= 0 && images[prev] && images[prev].complete && images[prev].naturalWidth > 0) {
        return images[prev];
      }
      const next = index + offset;
      if (next < TOTAL_FRAMES && images[next] && images[next].complete && images[next].naturalWidth > 0) {
        return images[next];
      }
    }
    return null;
  }

  function renderFrame(index) {
    const frameImg = getBestAvailableFrame(index);
    if (frameImg) {
      drawImageCover(frameImg);
      lastDrawnIndex = index;
    }
  }

  // Resize canvas to match display size with DPR support
  function handleResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    if (canvas.width !== Math.round(displayWidth * dpr) || canvas.height !== Math.round(displayHeight * dpr)) {
      canvas.width = Math.round(displayWidth * dpr);
      canvas.height = Math.round(displayHeight * dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }

    lastDrawnIndex = -1;
    renderFrame(Math.round(currentFrame));
  }

  const heroSection = document.querySelector('.hero-section');

  // Calculate target frame from scroll progress
  function updateTargetFromScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? Math.min(Math.max(scrollTop / scrollHeight, 0), 1) : 0;
    
    // Smoothly map frames directly to scroll progress, completing exact animation at footer
    targetFrame = Math.min(progress * (TOTAL_FRAMES - 1), TOTAL_FRAMES - 1);

    // Header background toggle
    if (header) {
      if (scrollTop > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    // Hero element parallax & smooth fade out on initial scroll
    if (heroSection) {
      const fadeProgress = Math.min(Math.max(scrollTop / 500, 0), 1);
      heroSection.style.opacity = String(1 - fadeProgress * 1.2);
      heroSection.style.transform = `translateY(${scrollTop * 0.25}px)`;
    }

    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(animationLoop);
    }
  }

  // Animation loop with linear interpolation (LERP)
  function animationLoop() {
    const delta = targetFrame - currentFrame;

    if (Math.abs(delta) > 0.001) {
      currentFrame += delta * LERP_FACTOR;
    } else {
      currentFrame = targetFrame;
    }

    const frameToRender = Math.round(currentFrame);
    if (frameToRender !== lastDrawnIndex) {
      renderFrame(frameToRender);
    }

    if (Math.abs(targetFrame - currentFrame) > 0.001) {
      requestAnimationFrame(animationLoop);
    } else {
      isTicking = false;
    }
  }

  // Preload frames gracefully in small batches to keep the main thread fluid
  function preloadImages() {
    // 1. Immediate first frame
    const firstImg = new Image();
    firstImg.src = getFrameUrl(0);
    firstImg.onload = () => {
      images[0] = firstImg;
      loadedCount++;
      handleResize();
      loadRemainingFrames(1);
    };
  }

  function loadRemainingFrames(startIndex) {
    const BATCH_SIZE = 15;
    let index = startIndex;

    function loadBatch() {
      const end = Math.min(index + BATCH_SIZE, TOTAL_FRAMES);
      for (let i = index; i < end; i++) {
        const img = new Image();
        img.src = getFrameUrl(i);
        img.onload = () => {
          loadedCount++;
          if (Math.round(currentFrame) === i) {
            renderFrame(i);
          }
        };
        images[i] = img;
      }
      index = end;
      if (index < TOTAL_FRAMES) {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(loadBatch, { timeout: 200 });
        } else {
          setTimeout(loadBatch, 30);
        }
      }
    }

    loadBatch();
  }

  // Smooth scroll anchor navigation
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Interactive inquiry form submission handling
  const inquiryForm = document.getElementById('inquiry-form');
  const formFeedback = document.getElementById('form-feedback');

  if (inquiryForm && formFeedback) {
    inquiryForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const submitBtn = inquiryForm.querySelector('.btn-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.querySelector('span').textContent = 'Submitting...';
      }

      setTimeout(() => {
        formFeedback.textContent = '✓ Thank you! Your inquiry has been received. We will be in touch shortly.';
        formFeedback.style.color = '#10B981';
        inquiryForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          submitBtn.querySelector('span').textContent = 'Inquiry Sent!';
          setTimeout(() => {
            submitBtn.querySelector('span').textContent = 'Submit Inquiry';
          }, 3500);
        }
      }, 600);
    });
  }

  // Event listeners
  window.addEventListener('scroll', updateTargetFromScroll, { passive: true });
  window.addEventListener('resize', handleResize);

  // Initialize
  handleResize();
  preloadImages();
  updateTargetFromScroll();
})();
