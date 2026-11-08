/**
 * CINELOVE THIỆP CƯỚI 1 - INTERACTIVE ENGINE
 * Đôi uyên ương: Nguyễn Duy Phương & Lê Thùy Dương (30.07.2026)
 * 
 * Tính năng chính:
 * 1. Web Audio Synthesizer: Nhạc nền lãng mạn không phụ thuộc file mp3
 * 2. Auto-Scroll Engine: Tự cuộn mượt mà trong .main-scroll-container
 * 3. CineLove Danmaku Blessings: Bong bóng lời chúc bay góc dưới trái
 * 4. Bắn tim (Shoot Hearts): Hiệu ứng tim bay lượn ngẫu nhiên
 * 5. Like Button: Bộ đếm lượt thích thời gian thực
 * 6. 3D Coverflow Slider: Album ảnh cưới đa chiều theo đúng CineLove
 * 7. Slide-up Bottom Sheets: Gửi lời chúc, Hộp mừng cưới VietQR & RSVP
 * 8. Đếm ngược thời gian thực, Phóng to ảnh (Lightbox) & Pháo hoa
 */

// =============================================================================
// 1. WEDDING BACKGROUND MUSIC & LIVE SYNCED LYRICS ("LỄ ĐƯỜNG" - KAI ĐINH)
// =============================================================================
const WEDDING_LYRICS = [
  { time: 15.5, text: "Người là nắng thiếu thời" },
  { time: 18.2, text: "Cướp đi hồn anh" },
  { time: 19.2, text: "Bằng một thoáng môi cười" },
  { time: 21.7, text: "Tháng năm học trò ấy" },
  { time: 23.3, text: "Dù muốn bên người" },
  { time: 24.9, text: "Chẳng dám tỏ tình" },
  { time: 26.5, text: "Vì sợ sẽ mất nhau..." },
  { time: 29.7, text: "Rồi năm tháng trôi dần" },
  { time: 31.9, text: "Vẫn là bạn của nhau" },
  { time: 34.0, text: "Dù chẳng ở gần" },
  { time: 35.6, text: "Nhưng tình đầu trong anh" },
  { time: 37.2, text: "Thì vẫn chưa nguôi" },
  { time: 39.3, text: "Lần nắm tay đầu như mới đây thôi" },
  { time: 43.1, text: "Chẳng thể ngờ tình đầu giấc mơ thiếu thời" },
  { time: 47.9, text: "Giờ trong màu trắng tinh khôi ✨" },
  { time: 50.6, text: "Em là người đầu tiên mà anh yêu" },
  { time: 53.8, text: "Anh muốn là người cuối cùng mà em yêu ❤️" },
  { time: 59.1, text: "Khoảnh khắc thấy em trên lễ đường" },
  { time: 62.3, text: "Cùng ánh mắt bóng dáng thân thương" },
  { time: 65.5, text: "Nhiều năm ấy chớp mắt trôi qua" },
  { time: 68.8, text: "Để ta giờ đây về chung một nhà 🏡" },
  { time: 72.5, text: "Và anh hứa yêu em suốt đời" },
  { time: 76.2, text: "Lời thiêng liêng anh hứa với trời" },
  { time: 79.9, text: "Dù đau ốm, nghèo khó, sóng gió, tổn thương" },
  { time: 83.7, text: "Thì anh vẫn luôn ở đây" },
  { time: 87.9, text: "Mình già đi cùng nhau, có nhau 💍" },
  { time: 109.0, text: "Chàng trai khiến em cười" },
  { time: 111.7, text: "Đôi khi chẳng cần em phải nói ra lời" },
  { time: 115.0, text: "Vẫn luôn hiểu từng điều" },
  { time: 116.5, text: "Em giữ âm thầm" },
  { time: 118.2, text: "Phải chăng anh là tương lai của em" },
  { time: 121.9, text: "Ở bên người khiến em luôn thấy an toàn" },
  { time: 127.6, text: "Để em là chính em" },
  { time: 129.8, text: "Không phải sợ già đi hay cô đơn" },
  { time: 133.0, text: "Vì từng ngày trôi anh luôn yêu em hơn ❤️" },
  { time: 136.3, text: "Khoảnh khắc thấy em trên lễ đường" },
  { time: 139.4, text: "Cùng ánh mắt bóng dáng thân thương" },
  { time: 143.2, text: "Nhiều năm ấy chớp mắt trôi qua" },
  { time: 146.5, text: "Để ta giờ đây về chung một nhà 🏡" },
  { time: 150.2, text: "Và em hứa yêu anh suốt đời" },
  { time: 153.7, text: "Lời thiêng liêng em hứa với trời" },
  { time: 157.5, text: "Dù đau ốm, nghèo khó, sóng gió, tổn thương" },
  { time: 161.3, text: "Thì em vẫn luôn ở đây" },
  { time: 164.4, text: "Mình già đi cùng nhau, có nhau 💍" },
  { time: 187.6, text: "Giờ ta có thêm một gia đình" },
  { time: 190.8, text: "Hạnh phúc có thêm một sinh linh 👶" },
  { time: 194.5, text: "Nhiều năm ấy chớp mắt trôi qua" },
  { time: 197.7, text: "Và con giờ đây lớn lên từng ngày" },
  { time: 201.4, text: "Và ta hứa yêu con suốt đời" },
  { time: 205.2, text: "Lời thiêng liêng ta hứa với trời" },
  { time: 208.4, text: "Dù đau ốm, nghèo khó, sóng gió, tổn thương" },
  { time: 212.7, text: "Thì ba mẹ luôn ở đây" },
  { time: 217.3, text: "Mình già đi cùng nhau, có nhau 💖" }
];

class WeddingBgMusicEngine {
  constructor(audioElementId = 'weddingBgMusic') {
    this.audio = document.getElementById(audioElementId);
    this.isPlaying = false;
    this.hasUnlocked = false;
    this.fadeInterval = null;
    this.targetVolume = 0.85;
    this.currentLyricIndex = -1;
    this.lyricElements = [];

    // UI Elements
    this.topToggleBtn = document.getElementById('cineloveAudioToggle');
    this.muteLine = document.getElementById('audioMuteLine');
    this.autoplayPrompt = document.getElementById('audioAutoplayPrompt');
    this.cardPlayBtn = document.getElementById('musicCardPlayBtn');
    this.cardDisc = document.getElementById('musicCardDisc');
    this.pillIcon = document.getElementById('playPillIcon');
    this.pillText = document.getElementById('playPillText');
    this.progressBar = document.getElementById('musicProgressBar');
    this.progressFill = document.getElementById('musicProgressFill');
    this.currentTimeEl = document.getElementById('musicCurrentTime');
    this.totalTimeEl = document.getElementById('musicTotalTime');
    this.lyricsContainer = document.getElementById('lyricsContainer');
    this.lyricsList = document.getElementById('lyricsList');

    this.init();
  }

  init() {
    if (!this.audio) return;

    this.audio.loop = true;
    this.audio.volume = this.targetVolume;

    // Render synced lyrics list
    this.renderLyrics();

    // Handle duration when metadata is loaded
    this.audio.addEventListener('loadedmetadata', () => {
      this.updateTotalDuration();
    });

    if (this.audio.readyState >= 1) {
      this.updateTotalDuration();
    }

    // Update progress bar & dynamic lyrics
    this.audio.addEventListener('timeupdate', () => {
      this.onTimeUpdate();
    });

    // Native audio play/pause events keep UI fully in sync
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.hasUnlocked = true;
      this.updateUI(true);
      this.hideAutoplayPrompt();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updateUI(false);
    });

    this.audio.addEventListener('ended', () => {
      if (!this.audio.loop) {
        this.isPlaying = false;
        this.updateUI(false);
      }
    });

    // Top-Right CineLove Vinyl Disc Button click
    if (this.topToggleBtn) {
      this.topToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    // Autoplay prompt click
    if (this.autoplayPrompt) {
      this.autoplayPrompt.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playWithFade(400);
        this.hideAutoplayPrompt();
      });
    }

    // Section 2.5 Play Pill Button click
    if (this.cardPlayBtn) {
      this.cardPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    // Progress Bar seek click
    if (this.progressBar) {
      this.progressBar.addEventListener('click', (e) => {
        this.onProgressClick(e);
      });
    }

    // 1. Try immediate autoplay on page load or reload
    this.tryImmediateAutoplay();

    // 2. Also attempt when page fully loads
    window.addEventListener('load', () => {
      if (this.audio.paused) this.tryImmediateAutoplay();
    });
    window.addEventListener('pageshow', () => {
      if (this.audio.paused) this.tryImmediateAutoplay();
    });

    // 3. Setup gesture unlock if browser policy blocks initial unmuted sound
    this.setupAutoplayUnlock();
  }

  renderLyrics() {
    if (!this.lyricsList) return;
    this.lyricsList.innerHTML = '';
    this.lyricElements = [];

    WEDDING_LYRICS.forEach((item, index) => {
      const lineDiv = document.createElement('div');
      lineDiv.className = 'lyric-line';
      lineDiv.textContent = item.text;
      lineDiv.dataset.index = index;
      lineDiv.dataset.time = item.time;

      lineDiv.addEventListener('click', () => {
        if (!this.audio) return;
        this.audio.currentTime = item.time;
        if (this.audio.paused) {
          this.playWithFade(400);
        }
        this.updateLyrics(item.time, true);
      });

      this.lyricsList.appendChild(lineDiv);
      this.lyricElements.push(lineDiv);
    });
  }

  updateLyrics(currentTime, forceScroll = false) {
    if (!this.lyricElements || this.lyricElements.length === 0) return;

    let activeIdx = -1;
    for (let i = 0; i < WEDDING_LYRICS.length; i++) {
      if (currentTime >= WEDDING_LYRICS[i].time) {
        activeIdx = i;
      } else {
        break;
      }
    }

    if (activeIdx !== this.currentLyricIndex || forceScroll) {
      this.currentLyricIndex = activeIdx;

      this.lyricElements.forEach((el, idx) => {
        if (idx === activeIdx) {
          el.classList.add('active');
          el.classList.remove('passed');
        } else if (idx < activeIdx) {
          el.classList.remove('active');
          el.classList.add('passed');
        } else {
          el.classList.remove('active', 'passed');
        }
      });

      if (activeIdx >= 0 && this.lyricsContainer && this.lyricElements[activeIdx]) {
        const activeEl = this.lyricElements[activeIdx];
        const containerH = this.lyricsContainer.clientHeight;
        const lineTop = activeEl.offsetTop;
        const lineH = activeEl.clientHeight;
        const targetScroll = lineTop - (containerH / 2) + (lineH / 2);

        this.lyricsContainer.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }
    }
  }

  tryImmediateAutoplay() {
    if (!this.audio) return;
    this.audio.volume = this.targetVolume;
    const p = this.audio.play();
    if (p !== undefined) {
      p.then(() => {
        this.isPlaying = true;
        this.hasUnlocked = true;
        this.updateUI(true);
        this.hideAutoplayPrompt();
      }).catch(err => {
        console.log('Autoplay deferred until first user gesture:', err.name);
        this.showAutoplayPrompt();
      });
    }
  }

  showAutoplayPrompt() {
    if (this.autoplayPrompt && !this.isPlaying) {
      this.autoplayPrompt.style.display = 'flex';
      this.autoplayPrompt.classList.remove('hide');
    }
  }

  hideAutoplayPrompt() {
    if (this.autoplayPrompt) {
      this.autoplayPrompt.classList.add('hide');
      setTimeout(() => {
        if (this.autoplayPrompt.classList.contains('hide')) {
          this.autoplayPrompt.style.display = 'none';
        }
      }, 400);
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  updateTotalDuration() {
    if (this.audio && this.audio.duration && !isNaN(this.audio.duration) && this.totalTimeEl) {
      this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
    }
  }

  onTimeUpdate() {
    if (!this.audio || isNaN(this.audio.duration) || this.audio.duration === 0) return;
    const current = this.audio.currentTime;
    const duration = this.audio.duration;
    const percent = Math.min(100, Math.max(0, (current / duration) * 100));

    if (this.progressFill) {
      this.progressFill.style.width = `${percent}%`;
    }
    if (this.currentTimeEl) {
      this.currentTimeEl.textContent = this.formatTime(current);
    }
    if (this.totalTimeEl && duration > 0) {
      this.totalTimeEl.textContent = this.formatTime(duration);
    }

    // Dynamic Lyrics Auto-Scroll
    this.updateLyrics(current);
  }

  onProgressClick(e) {
    if (!this.audio || !this.progressBar) return;
    const rect = this.progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    if (width <= 0) return;

    const ratio = Math.max(0, Math.min(1, clickX / width));
    if (this.audio.duration) {
      this.audio.currentTime = ratio * this.audio.duration;
      if (this.audio.paused) {
        this.playWithFade();
      }
      this.updateLyrics(this.audio.currentTime, true);
    }
  }

  playWithFade(duration = 800) {
    if (!this.audio) return;
    if (this.fadeInterval) clearInterval(this.fadeInterval);

    if (this.audio.paused) {
      this.audio.volume = 0;
      const promise = this.audio.play();
      if (promise !== undefined) {
        promise.then(() => {
          this.isPlaying = true;
          this.hasUnlocked = true;
          this.hideAutoplayPrompt();
          this.fadeVolume(this.targetVolume, duration);
        }).catch(err => {
          console.warn('Playback deferred:', err);
        });
      }
    } else {
      this.fadeVolume(this.targetVolume, duration);
    }
  }

  fadeVolume(toVolume, duration = 800) {
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    const steps = 16;
    const stepTime = Math.max(20, Math.floor(duration / steps));
    const startVolume = this.audio.volume;
    const diff = toVolume - startVolume;
    let step = 0;

    this.fadeInterval = setInterval(() => {
      step++;
      const current = startVolume + (diff * (step / steps));
      this.audio.volume = Math.max(0, Math.min(1, current));

      if (step >= steps) {
        this.audio.volume = toVolume;
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
    }, stepTime);
  }

  pause() {
    if (!this.audio) return;
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    this.audio.pause();
    this.isPlaying = false;
    this.updateUI(false);
  }

  toggle() {
    if (!this.audio) return;
    if (this.audio.paused) {
      this.playWithFade(500);
      if (typeof showToast === 'function') {
        showToast('Đang phát: Lễ Đường — Kai Đinh 🎵');
      }
    } else {
      this.pause();
      if (typeof showToast === 'function') {
        showToast('Đã tạm dừng nhạc nền ⏸');
      }
    }
  }

  updateUI(playing) {
    // 1. Top Vinyl Disc Toggle
    if (this.topToggleBtn) {
      if (playing) {
        this.topToggleBtn.classList.add('mrotate');
        if (this.muteLine) this.muteLine.style.display = 'none';
      } else {
        this.topToggleBtn.classList.remove('mrotate');
        if (this.muteLine) this.muteLine.style.display = 'flex';
      }
    }

    // 2. Section 2.5 Music Card
    if (this.cardDisc) {
      if (playing) {
        this.cardDisc.classList.add('playing');
        this.cardDisc.classList.remove('paused');
      } else {
        this.cardDisc.classList.remove('playing');
        this.cardDisc.classList.add('paused');
      }
    }

    if (this.cardPlayBtn) {
      if (playing) {
        this.cardPlayBtn.classList.remove('paused');
        if (this.pillIcon) this.pillIcon.textContent = '⏸';
        if (this.pillText) this.pillText.textContent = 'Đang phát';
      } else {
        this.cardPlayBtn.classList.add('paused');
        if (this.pillIcon) this.pillIcon.textContent = '▶';
        if (this.pillText) this.pillText.textContent = 'Phát nhạc';
      }
    }
  }

  setupAutoplayUnlock() {
    const unlock = () => {
      if (this.hasUnlocked) return;
      this.hasUnlocked = true;
      if (this.audio && this.audio.paused) {
        this.playWithFade(800);
      }
      this.hideAutoplayPrompt();
      ['pointerdown', 'touchstart', 'click', 'keydown', 'wheel', 'mousemove', 'scroll'].forEach(evt => {
        window.removeEventListener(evt, unlock, { capture: true });
      });
      const container = document.getElementById('mainScrollContainer');
      if (container) {
        container.removeEventListener('scroll', unlock);
        container.removeEventListener('touchstart', unlock);
      }
    };

    ['pointerdown', 'touchstart', 'click', 'keydown', 'wheel', 'mousemove', 'scroll'].forEach(evt => {
      window.addEventListener(evt, unlock, { once: true, passive: true, capture: true });
    });

    const container = document.getElementById('mainScrollContainer');
    if (container) {
      container.addEventListener('scroll', unlock, { once: true, passive: true });
      container.addEventListener('touchstart', unlock, { once: true, passive: true });
    }
  }
}

// =============================================================================
// 2. AUTO-SCROLL ENGINE (TỰ ĐỘNG CUỘN TRONG .main-scroll-container)
// =============================================================================
class AutoScrollEngine {
  constructor(containerId = 'mainScrollContainer') {
    this.container = document.getElementById(containerId);
    this.isScrolling = false;
    this.speed = 0.85; // tốc độ cuộn êm ái vừa mắt đọc
    this.rafId = null;
    this.userInterruptedTimeout = null;
    this.toggleBtn = document.getElementById('autoScrollToggleBtn');
    this.iconEl = document.getElementById('scrollIcon');
    this.labelEl = document.getElementById('scrollLabel');

    this.init();
  }

  init() {
    if (!this.container) return;

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    // Tạm dừng khi người dùng tự cuộn tay
    const pauseOnInteraction = () => {
      if (this.isScrolling) {
        this.stopRaf();
        if (this.userInterruptedTimeout) clearTimeout(this.userInterruptedTimeout);
        this.userInterruptedTimeout = setTimeout(() => {
          if (this.isScrolling) this.runLoop();
        }, 2500); // Tự tiếp tục cuộn sau 2.5s không chạm màn hình
      }
    };

    this.container.addEventListener('wheel', pauseOnInteraction, { passive: true });
    this.container.addEventListener('touchstart', pauseOnInteraction, { passive: true });
  }

  runLoop() {
    this.stopRaf();
    if (!this.container) return;

    const step = () => {
      if (!this.isScrolling) return;

      const maxScroll = this.container.scrollHeight - this.container.clientHeight;
      if (this.container.scrollTop >= maxScroll - 4) {
        this.stop();
        showToast('Đã xem trọn vẹn thiệp cưới! Cảm ơn quý khách ❤️');
        return;
      }

      this.container.scrollTop += this.speed;
      this.rafId = requestAnimationFrame(step);
    };

    this.rafId = requestAnimationFrame(step);
  }

  stopRaf() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  start() {
    this.isScrolling = true;
    if (this.toggleBtn) this.toggleBtn.classList.add('scrolling');
    if (this.iconEl) this.iconEl.textContent = '⏸';
    if (this.labelEl) this.labelEl.textContent = 'Tạm dừng';
    this.runLoop();
  }

  stop() {
    this.isScrolling = false;
    this.stopRaf();
    if (this.userInterruptedTimeout) clearTimeout(this.userInterruptedTimeout);
    if (this.toggleBtn) this.toggleBtn.classList.remove('scrolling');
    if (this.iconEl) this.iconEl.textContent = '⏵';
    if (this.labelEl) this.labelEl.textContent = 'Tự cuộn';
  }

  toggle() {
    if (this.isScrolling) {
      this.stop();
      showToast('Đã tạm dừng tự động cuộn');
    } else {
      this.start();
      showToast('Đang tự động cuộn thiệp cưới ✨');
    }
  }
}

// =============================================================================
// 3. CINELOVE FLOATING DANMAKU BLESSINGS ENGINE
// =============================================================================
class DanmakuEngine {
  constructor(containerId = 'blessing-box') {
    this.container = document.getElementById(containerId);
    this.wishesPool = [
      'Quỳnh Nga: Chúc hai bạn trăm năm hạnh phúc, mãi ngọt ngào! 🌸',
      'Minh Tuấn: Phương & Dương xứng đôi vừa lứa nhất quả đất ❤️',
      'Bác Ba: Chúc hai cháu trăm năm tình viên mãn 囍',
      'Thảo My: Thùy Dương hôm nay xinh đẹp tuyệt trần! 👰',
      'Hoàng Bách: Hạnh phúc viên mãn nha bạn hiền 🎉',
      'Thuỳ Trang: Chúc anh chị sớm đón thiên thần nhỏ nhé 👶',
      'Hải Đăng: Chúc mừng đám cưới trong mơ của cặp đôi vàng! ✨',
      'Kim Oanh: Chúc hai con vạn sự như ý, gia đạo an khang 💐',
      'Việt Anh: Nâng ly chúc mừng hạnh phúc của Duy Phương & Thùy Dương 🥂',
      'Phương Linh: Đám cưới đẹp như trong truyện cổ tích! 💖'
    ];
    this.timer = null;
    this.colors = [
      'rgba(255, 110, 135, 0.85)', // Rose pink
      'rgba(91, 140, 94, 0.85)',   // Mint green
      'rgba(197, 160, 89, 0.85)',  // Gold Champagne
      'rgba(240, 98, 146, 0.85)',  // Hot pink
      'rgba(42, 82, 45, 0.85)'     // Lotus deep green
    ];
    this.init();
  }

  init() {
    if (!this.container) return;

    // Load any user wishes stored in localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('wedding_wishes') || '[]');
      stored.forEach(w => {
        if (w.author && w.text) {
          this.wishesPool.unshift(`${w.author}: ${w.text}`);
        }
      });
    } catch (e) {
      console.warn(e);
    }

    // Load wishes from BE API
    this.loadWishesFromApi();

    // Spawn first bubble shortly after load
    setTimeout(() => this.spawnBubble(), 1200);

    // Regularly spawn bubbles every 3.8 - 4.5 seconds
    this.startLoop();
  }

  async loadWishesFromApi() {
    try {
      const res = await fetch('/api/wishes');
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : (json.data || []);
        if (list.length > 0) {
          const apiWishes = list.map(w => `${w.author}: ${w.text}`);
          this.wishesPool = [...apiWishes, ...this.wishesPool];
        }
      }
    } catch (e) {
      console.warn('API wishes load error:', e);
    }
  }

  startLoop() {
    const nextInterval = Math.floor(Math.random() * 1000 + 3600);
    this.timer = setTimeout(() => {
      this.spawnBubble();
      this.startLoop();
    }, nextInterval);
  }

  spawnBubble(customText = null, isUser = false) {
    if (!this.container) return;

    const text = customText || this.wishesPool[Math.floor(Math.random() * this.wishesPool.length)];
    const bubble = document.createElement('div');
    bubble.className = 'danmaku-item';
    
    if (isUser) {
      bubble.style.background = 'linear-gradient(135deg, #FF4969, #FF8E53)';
      bubble.style.fontWeight = '500';
      bubble.style.boxShadow = '0 4px 15px rgba(255, 73, 105, 0.4)';
    } else {
      bubble.style.background = this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    bubble.textContent = text;
    this.container.appendChild(bubble);

    // Keep max 4 bubbles inside DOM
    while (this.container.children.length > 4) {
      this.container.removeChild(this.container.firstChild);
    }

    // Auto remove after animation completes
    setTimeout(() => {
      if (bubble.parentNode === this.container) {
        this.container.removeChild(bubble);
      }
    }, 6600);
  }

  addWish(author, text) {
    const wishStr = `${author}: ${text}`;
    this.wishesPool.unshift(wishStr);
    this.spawnBubble(wishStr, true);
  }
}

// =============================================================================
// 4. FLOATING HEARTS ANIMATION (BẮN TIM THEO PHONG CÁCH CINELOVE)
// =============================================================================
function shootHearts(burstCount = 7) {
  const container = document.getElementById('cinelove-animation-box');
  if (!container) return;

  const heartIcons = ['💖', '❤️', '🌸', '💕', '✨', '🤍', '🥰'];

  for (let i = 0; i < burstCount; i++) {
    setTimeout(() => {
      const heart = document.createElement('div');
      heart.className = 'flying-heart';
      heart.textContent = heartIcons[Math.floor(Math.random() * heartIcons.length)];

      // Random starting X position near the bottom right (toolbar heart button)
      const baseLeft = 70 + (Math.random() - 0.5) * 25; // 57% to 82%
      heart.style.left = `${baseLeft}%`;

      // Random drift variables for keyframe animation
      const driftX = (Math.random() - 0.5) * 60;
      const driftEnd = (Math.random() - 0.5) * 110;
      const rot = (Math.random() - 0.5) * 45;
      const rotEnd = (Math.random() - 0.5) * 90;
      const fontSize = Math.floor(Math.random() * 12 + 18); // 18px - 30px

      heart.style.fontSize = `${fontSize}px`;
      heart.style.setProperty('--drift-x', `${driftX}px`);
      heart.style.setProperty('--drift-end', `${driftEnd}px`);
      heart.style.setProperty('--rot', `${rot}deg`);
      heart.style.setProperty('--rot-end', `${rotEnd}deg`);

      container.appendChild(heart);

      setTimeout(() => heart.remove(), 2900);
    }, i * 110);
  }
}

// =============================================================================
// 5. 3D COVERFLOW SLIDER (ALBUM HÌNH CƯỚI THEO MẪU CINELOVE)
// =============================================================================
class CoverflowSlider {
  constructor(wrapperId = 'coverflowWrapper') {
    this.wrapper = document.getElementById(wrapperId);
    if (!this.wrapper) return;

    this.slides = Array.from(this.wrapper.querySelectorAll('.coverflow-slide'));
    this.prevBtn = document.getElementById('coverflowPrevBtn');
    this.nextBtn = document.getElementById('coverflowNextBtn');
    this.paginationEl = document.getElementById('coverflowPagination');

    this.total = this.slides.length;
    this.currentIndex = 2; // Start focused on center hero slide (index 2)
    this.autoPlayTimer = null;
    this.resumeTimer = null;
    this.autoPlayInterval = 3200; // Nhịp nhàng 3.2 giây chuyển ảnh

    this.init();
  }

  init() {
    this.renderPagination();
    this.update();

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.prev();
        this.resetAutoPlay();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.next();
        this.resetAutoPlay();
      });
    }

    // Click on slides
    this.slides.forEach((slide, idx) => {
      slide.addEventListener('click', () => {
        if (this.currentIndex === idx) {
          // Open lightbox when clicking the active center slide
          if (window.openWeddingLightbox) window.openWeddingLightbox(idx);
        } else {
          // Rotate clicked slide to center
          this.goTo(idx);
          this.resetAutoPlay();
        }
      });
    });

    // Touch and drag swipe gestures (horizontal switch and vertical pull-up)
    let touchStartX = 0;
    let touchStartY = 0;
    this.wrapper.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    this.wrapper.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // Vertical pull-up swipe (kéo ảnh lên) to expand photo into fullscreen
      if (diffY < -50 && Math.abs(diffY) > Math.abs(diffX)) {
        if (window.openWeddingLightbox) window.openWeddingLightbox(this.currentIndex);
        return;
      }

      // Horizontal swipe to flip photos
      if (Math.abs(diffX) > 35) {
        if (diffX > 0) this.prev();
        else this.next();
        this.resetAutoPlay();
      }
    }, { passive: true });

    // Auto rotate
    this.startAutoPlay();
    this.wrapper.addEventListener('mouseenter', () => this.pauseAutoPlay());
    this.wrapper.addEventListener('mouseleave', () => this.startAutoPlay());
    this.wrapper.addEventListener('touchstart', () => this.pauseAutoPlay(), { passive: true });
    this.wrapper.addEventListener('touchend', () => this.resetAutoPlay(), { passive: true });
  }

  renderPagination() {
    if (!this.paginationEl) return;
    this.paginationEl.innerHTML = '';
    for (let i = 0; i < this.total; i++) {
      const dot = document.createElement('div');
      dot.className = `coverflow-dot ${i === this.currentIndex ? 'active' : ''}`;
      dot.addEventListener('click', () => {
        this.goTo(i);
        this.resetAutoPlay();
      });
      this.paginationEl.appendChild(dot);
    }
  }

  updatePagination() {
    if (!this.paginationEl) return;
    const dots = this.paginationEl.querySelectorAll('.coverflow-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === this.currentIndex);
    });
  }

  update() {
    this.slides.forEach((slide, i) => {
      let offset = (i - this.currentIndex + this.total) % this.total;
      if (offset > this.total / 2) {
        offset -= this.total;
      }

      slide.classList.remove('is-active', 'is-next-1', 'is-next-2', 'is-prev-1', 'is-prev-2', 'is-hidden');

      if (offset === 0) {
        slide.classList.add('is-active');
      } else if (offset === 1) {
        slide.classList.add('is-next-1');
      } else if (offset === 2) {
        slide.classList.add('is-next-2');
      } else if (offset === -1) {
        slide.classList.add('is-prev-1');
      } else if (offset === -2) {
        slide.classList.add('is-prev-2');
      } else {
        slide.classList.add('is-hidden');
      }
    });

    this.updatePagination();
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.total;
    this.update();
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.total) % this.total;
    this.update();
  }

  goTo(index) {
    this.currentIndex = index;
    this.update();
  }

  startAutoPlay() {
    this.pauseAutoPlay();
    this.autoPlayTimer = setInterval(() => this.next(), this.autoPlayInterval);
  }

  pauseAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  resetAutoPlay() {
    this.pauseAutoPlay();
    if (this.resumeTimer) clearTimeout(this.resumeTimer);
    this.resumeTimer = setTimeout(() => {
      this.startAutoPlay();
    }, 2400);
  }
}

// =============================================================================
// 5B. 3D PAGE-FLIPPING WEDDING PHOTOBOOK ENGINE (ALBUM PRE-WEDDING LẬT TRANG)
// =============================================================================
const ALBUM_LEAVES = [
  {
    front: 'assets/images/pre-wedding/pages/cover-front.jpg',
    back: 'assets/images/pre-wedding/pages/page-01-L.jpg',
    frontHardcover: true,
    frontAlt: 'You Are My Destiny',
    backAlt: 'Pure Beginnings'
  },
  {
    front: 'assets/images/pre-wedding/pages/page-01-R.jpg',
    back: 'assets/images/pre-wedding/pages/page-02-L.jpg',
    frontAlt: 'Pure Beginnings',
    backAlt: 'Chasing You'
  },
  {
    front: 'assets/images/pre-wedding/pages/page-02-R.jpg',
    back: 'assets/images/pre-wedding/pages/page-03-L.jpg',
    frontAlt: 'Chasing You',
    backAlt: 'Waltz of Love'
  },
  {
    front: 'assets/images/pre-wedding/pages/page-03-R.jpg',
    back: 'assets/images/pre-wedding/pages/page-04-L.jpg',
    frontAlt: 'Waltz of Love',
    backAlt: 'By Your Side'
  },
  {
    front: 'assets/images/pre-wedding/pages/page-04-R.jpg',
    back: 'assets/images/pre-wedding/pages/page-05-L.jpg',
    frontAlt: 'By Your Side',
    backAlt: 'Forever Together'
  },
  {
    front: 'assets/images/pre-wedding/pages/page-05-R.jpg',
    back: 'assets/images/pre-wedding/pages/page-06-L.jpg',
    frontAlt: 'Forever Together',
    backAlt: 'Hello Muse'
  },
  {
    front: 'assets/images/pre-wedding/pages/page-06-R.jpg',
    back: 'assets/images/pre-wedding/pages/page-07-L.jpg',
    frontAlt: 'Hello Muse',
    backAlt: 'Mother & Little Angel'
  },
  {
    front: 'assets/images/pre-wedding/pages/page-07-R.jpg',
    back: 'assets/images/pre-wedding/pages/page-08-L.jpg',
    frontAlt: 'Mother & Little Angel',
    backAlt: 'Our Happy Family'
  },
  {
    front: 'assets/images/pre-wedding/pages/page-08-R.jpg',
    back: 'assets/images/pre-wedding/pages/page-09-L.jpg',
    frontAlt: 'Our Happy Family',
    backAlt: 'She — Under the Veil'
  },
  {
    front: 'assets/images/pre-wedding/pages/page-09-R.jpg',
    back: 'assets/images/pre-wedding/pages/page-10-L.jpg',
    frontAlt: 'She — Under the Veil',
    backAlt: 'Tender Gaze'
  },
  {
    front: 'assets/images/pre-wedding/pages/page-10-R.jpg',
    back: 'assets/images/pre-wedding/pages/page-11-L.jpg',
    frontAlt: 'Tender Gaze',
    backAlt: 'Captured on Film'
  },
  {
    front: 'assets/images/pre-wedding/pages/page-11-R.jpg',
    back: 'assets/images/pre-wedding/pages/page-12-L.jpg',
    frontAlt: 'Captured on Film',
    backAlt: 'My Heart Will Go On'
  },
  {
    front: 'assets/images/pre-wedding/pages/page-12-R.jpg',
    back: 'assets/images/pre-wedding/pages/cover-back.jpg',
    backHardcover: true,
    frontAlt: 'My Heart Will Go On',
    backAlt: 'The Wedding Book'
  }
];

const ALBUM_SPREAD_META = [
  { label: 'Bìa', title: 'You Are My Destiny', counter: 'Bìa trước · 12 trang đôi', leftThumb: null, rightThumb: 'assets/images/pre-wedding/thumbs/cover-front.jpg', zoomIdx: 0 },
  { label: '01', title: 'Pure Beginnings', counter: 'Trang 01–02 / 24', leftThumb: 'assets/images/pre-wedding/thumbs/page-01-L.jpg', rightThumb: 'assets/images/pre-wedding/thumbs/page-01-R.jpg', zoomIdx: 1 },
  { label: '02', title: 'Chasing You', counter: 'Trang 03–04 / 24', leftThumb: 'assets/images/pre-wedding/thumbs/page-02-L.jpg', rightThumb: 'assets/images/pre-wedding/thumbs/page-02-R.jpg', zoomIdx: 3 },
  { label: '03', title: 'Waltz of Love', counter: 'Trang 05–06 / 24', leftThumb: 'assets/images/pre-wedding/thumbs/page-03-L.jpg', rightThumb: 'assets/images/pre-wedding/thumbs/page-03-R.jpg', zoomIdx: 5 },
  { label: '04', title: 'By Your Side', counter: 'Trang 07–08 / 24', leftThumb: 'assets/images/pre-wedding/thumbs/page-04-L.jpg', rightThumb: 'assets/images/pre-wedding/thumbs/page-04-R.jpg', zoomIdx: 7 },
  { label: '05', title: 'Forever Together', counter: 'Trang 09–10 / 24', leftThumb: 'assets/images/pre-wedding/thumbs/page-05-L.jpg', rightThumb: 'assets/images/pre-wedding/thumbs/page-05-R.jpg', zoomIdx: 9 },
  { label: '06', title: 'Hello Muse', counter: 'Trang 11–12 / 24', leftThumb: 'assets/images/pre-wedding/thumbs/page-06-L.jpg', rightThumb: 'assets/images/pre-wedding/thumbs/page-06-R.jpg', zoomIdx: 11 },
  { label: '07', title: 'Mother & Little Angel', counter: 'Trang 13–14 / 24', leftThumb: 'assets/images/pre-wedding/thumbs/page-07-L.jpg', rightThumb: 'assets/images/pre-wedding/thumbs/page-07-R.jpg', zoomIdx: 13 },
  { label: '08', title: 'Our Happy Family', counter: 'Trang 15–16 / 24', leftThumb: 'assets/images/pre-wedding/thumbs/page-08-L.jpg', rightThumb: 'assets/images/pre-wedding/thumbs/page-08-R.jpg', zoomIdx: 15 },
  { label: '09', title: 'She — Under the Veil', counter: 'Trang 17–18 / 24', leftThumb: 'assets/images/pre-wedding/thumbs/page-09-L.jpg', rightThumb: 'assets/images/pre-wedding/thumbs/page-09-R.jpg', zoomIdx: 17 },
  { label: '10', title: 'Tender Gaze', counter: 'Trang 19–20 / 24', leftThumb: 'assets/images/pre-wedding/thumbs/page-10-L.jpg', rightThumb: 'assets/images/pre-wedding/thumbs/page-10-R.jpg', zoomIdx: 19 },
  { label: '11', title: 'Captured on Film', counter: 'Trang 21–22 / 24', leftThumb: 'assets/images/pre-wedding/thumbs/page-11-L.jpg', rightThumb: 'assets/images/pre-wedding/thumbs/page-11-R.jpg', zoomIdx: 21 },
  { label: '12', title: 'My Heart Will Go On', counter: 'Trang 23–24 / 24', leftThumb: 'assets/images/pre-wedding/thumbs/page-12-L.jpg', rightThumb: 'assets/images/pre-wedding/thumbs/page-12-R.jpg', zoomIdx: 23 },
  { label: 'Kết', title: 'The Wedding Book', counter: 'Bìa sau · Trọn vẹn yêu thương', leftThumb: 'assets/images/pre-wedding/thumbs/cover-back.jpg', rightThumb: null, zoomIdx: 25 }
];

const ALBUM_SINGLE_PAGES = (() => {
  const list = [
    { src: 'assets/images/pre-wedding/pages/cover-front.jpg', caption: 'You Are My Destiny' }
  ];
  for (let i = 1; i <= 12; i++) {
    const num = String(i).padStart(2, '0');
    const meta = ALBUM_SPREAD_META[i];
    const pLeft = i * 2 - 1;
    const pRight = i * 2;
    list.push({
      src: `assets/images/pre-wedding/pages/page-${num}-L.jpg`,
      caption: `${meta.title} (${String(pLeft).padStart(2, '0')} / 24)`
    });
    list.push({
      src: `assets/images/pre-wedding/pages/page-${num}-R.jpg`,
      caption: `${meta.title} (${String(pRight).padStart(2, '0')} / 24)`
    });
  }
  list.push({
    src: 'assets/images/pre-wedding/pages/cover-back.jpg',
    caption: 'The Wedding Book'
  });
  return list;
})();

let flipAudioCtx = null;
let lastFlipAudioTime = 0;
function playPageFlipAudio() {
  try {
    const now = performance.now();
    if (now - lastFlipAudioTime < 80) return;
    lastFlipAudioTime = now;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!flipAudioCtx) flipAudioCtx = new AudioContext();
    if (flipAudioCtx.state === 'suspended') {
      flipAudioCtx.resume().catch(() => {});
    }
    const t = flipAudioCtx.currentTime;
    const dur = 0.16;
    const buffer = flipAudioCtx.createBuffer(1, Math.floor(flipAudioCtx.sampleRate * dur), flipAudioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i / data.length), 2);
    }
    const noise = flipAudioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = flipAudioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + dur);
    filter.Q.value = 1.4;

    const gain = flipAudioCtx.createGain();
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(flipAudioCtx.destination);

    noise.start(t);
  } catch (_) {}
}

class WeddingFlipbook {
  constructor(opts) {
    this.viewportEl = document.getElementById(opts.viewportId);
    this.bookEl = document.getElementById(opts.bookId);
    this.leavesLayerEl = document.getElementById(opts.leavesId);
    if (!this.viewportEl || !this.bookEl || !this.leavesLayerEl) return;

    this.stackLeftEl = document.getElementById(opts.stackLeftId);
    this.stackRightEl = document.getElementById(opts.stackRightId);
    this.titleEl = document.getElementById(opts.titleId);
    this.counterEl = document.getElementById(opts.counterId);
    this.prevBtn = opts.prevBtnId ? document.getElementById(opts.prevBtnId) : null;
    this.nextBtn = opts.nextBtnId ? document.getElementById(opts.nextBtnId) : null;
    this.thumbStripEl = document.getElementById(opts.thumbStripId);
    this.coverCtaEl = opts.coverCtaId ? document.getElementById(opts.coverCtaId) : null;
    this.autoBtn = opts.autoBtnId ? document.getElementById(opts.autoBtnId) : null;
    this.autoIconEl = opts.autoIconId ? document.getElementById(opts.autoIconId) : null;
    this.autoTextEl = opts.autoTextId ? document.getElementById(opts.autoTextId) : null;
    this.onSpreadChange = opts.onSpreadChange || null;
    this.autoIntervalMs = opts.autoIntervalMs || 3000;
    this.autoResumeMs = opts.autoResumeMs || 0;
    this.canAutoResume = opts.canAutoResume || null;

    this.totalLeaves = ALBUM_LEAVES.length; // 13 leaves -> spreads 0..13
    this.maxSpread = this.totalLeaves;
    this.currentSpread = 0;
    this.leafEls = [];
    this.leafTimers = new Map();
    this.cascadeTimers = [];
    this.turnSeq = 0;
    this.autoPlayTimer = null;
    this.autoFirstTickTimer = null;
    this.autoResumeTimer = null;
    this.isAutoPlaying = false;

    this.renderLeaves();
    this.renderThumbnails();
    this.bindNavigation();
    this.bindHoverPeek();
    this.bindPointerDrag();
    this.applyState({ animate: false });
    this.preloadAround(0);

    // Preload remaining album pages politely in background once page settles
    setTimeout(() => this.preloadAllRemaining(), 2200);
  }

  renderLeaves() {
    this.leavesLayerEl.innerHTML = '';
    this.leafEls = [];

    ALBUM_LEAVES.forEach((leaf, idx) => {
      const leafDiv = document.createElement('div');
      leafDiv.className = 'alb-leaf';
      leafDiv.dataset.leaf = String(idx);

      // Front face (Right side page when facing up)
      const frontDiv = document.createElement('div');
      frontDiv.className = `alb-face alb-front${leaf.frontHardcover ? ' is-hardcover' : ''}`;
      const frontImg = document.createElement('img');
      frontImg.alt = leaf.frontAlt || `Trang album`;
      frontImg.draggable = false;
      if (idx <= 2) {
        frontImg.src = leaf.front;
      } else {
        frontImg.dataset.src = leaf.front;
      }
      const frontShade = document.createElement('div');
      frontShade.className = 'alb-turn-shade';
      const frontSheen = document.createElement('div');
      frontSheen.className = 'alb-page-sheen';
      const cornerPeelRight = document.createElement('div');
      cornerPeelRight.className = 'alb-corner-peel peel-right';
      frontDiv.append(frontImg, frontShade, frontSheen, cornerPeelRight);

      // Back face (Left side page when flipped open)
      const backDiv = document.createElement('div');
      backDiv.className = `alb-face alb-back${leaf.backHardcover ? ' is-hardcover' : ''}`;
      const backImg = document.createElement('img');
      backImg.alt = leaf.backAlt || `Trang album`;
      backImg.draggable = false;
      if (idx <= 2) {
        backImg.src = leaf.back;
      } else {
        backImg.dataset.src = leaf.back;
      }
      const backShade = document.createElement('div');
      backShade.className = 'alb-turn-shade';
      const backSheen = document.createElement('div');
      backSheen.className = 'alb-page-sheen';
      const cornerPeelLeft = document.createElement('div');
      cornerPeelLeft.className = 'alb-corner-peel peel-left';
      backDiv.append(backImg, backShade, backSheen, cornerPeelLeft);

      leafDiv.appendChild(frontDiv);
      leafDiv.appendChild(backDiv);
      this.leavesLayerEl.appendChild(leafDiv);
      this.leafEls.push(leafDiv);
    });
  }

  renderThumbnails() {
    if (!this.thumbStripEl) return;
    this.thumbStripEl.innerHTML = '';

    ALBUM_SPREAD_META.forEach((meta, spreadIdx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `alb-thumb-item${spreadIdx === this.currentSpread ? ' active' : ''}`;
      btn.dataset.spread = String(spreadIdx);
      btn.title = meta.title;

      const spreadBox = document.createElement('div');
      spreadBox.className = 'alb-thumb-spread';

      if (meta.leftThumb) {
        const imgL = document.createElement('img');
        imgL.src = meta.leftThumb;
        imgL.alt = meta.label;
        imgL.loading = 'lazy';
        spreadBox.appendChild(imgL);
      }
      if (meta.rightThumb) {
        const imgR = document.createElement('img');
        imgR.src = meta.rightThumb;
        imgR.alt = meta.label;
        imgR.loading = 'lazy';
        spreadBox.appendChild(imgR);
      }

      const lbl = document.createElement('span');
      lbl.className = 'alb-thumb-label';
      lbl.textContent = meta.label;

      btn.appendChild(spreadBox);
      btn.appendChild(lbl);

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pauseForUserInteraction();
        this.jumpTo(spreadIdx);
      });

      this.thumbStripEl.appendChild(btn);
    });
  }

  bindNavigation() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pauseForUserInteraction();
        this.prev();
      });
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pauseForUserInteraction();
        this.next();
      });
    }
    if (this.coverCtaEl) {
      this.coverCtaEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pauseForUserInteraction();
        if (this.currentSpread === 0) this.next();
      });
    }
    if (this.autoBtn) {
      this.autoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleAutoPlay();
      });
    }
  }

  bindHoverPeek() {
    const clearHover = () => {
      this.viewportEl.classList.remove('hover-next', 'hover-prev');
    };

    this.viewportEl.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || this.viewportEl.classList.contains('is-dragging')) return;
      const r = this.viewportEl.getBoundingClientRect();
      if (!r.width) return;
      const relX = (e.clientX - r.left) / r.width;

      if (this.currentSpread === 0) {
        this.viewportEl.classList.add('hover-next');
        this.viewportEl.classList.remove('hover-prev');
      } else if (this.currentSpread === this.maxSpread) {
        this.viewportEl.classList.add('hover-prev');
        this.viewportEl.classList.remove('hover-next');
      } else if (relX >= 0.5) {
        this.viewportEl.classList.add('hover-next');
        this.viewportEl.classList.remove('hover-prev');
      } else {
        this.viewportEl.classList.add('hover-prev');
        this.viewportEl.classList.remove('hover-next');
      }
    });

    this.viewportEl.addEventListener('pointerleave', clearHover);
  }

  bindPointerDrag() {
    let pointerActive = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isHorizontalDrag = false;
    let dragAborted = false;
    let dragDir = null; // 'next' | 'prev'
    let activeLeafIdx = -1;
    let dragProgress = 0;
    let lastDx = 0;
    let rect = null;

    const isTheater = this.viewportEl.classList.contains('alb-theater-viewport');
    const coverScale = isTheater ? 1.13 : 1.18;

    const resetInlineDragStyles = () => {
      this.viewportEl.classList.remove('is-dragging', 'hover-next', 'hover-prev');
      this.bookEl.classList.remove('is-dragging');
      this.bookEl.style.transform = '';
      if (activeLeafIdx >= 0 && this.leafEls[activeLeafIdx]) {
        const leaf = this.leafEls[activeLeafIdx];
        leaf.classList.remove('is-dragging');
        leaf.style.transform = '';
        const fShade = leaf.querySelector('.alb-front .alb-turn-shade');
        const bShade = leaf.querySelector('.alb-back .alb-turn-shade');
        const fSheen = leaf.querySelector('.alb-front .alb-page-sheen');
        const bSheen = leaf.querySelector('.alb-back .alb-page-sheen');
        if (fShade) fShade.style.removeProperty('--shade-opacity');
        if (bShade) bShade.style.removeProperty('--shade-opacity');
        if (fSheen) {
          fSheen.style.removeProperty('--sheen-opacity');
          fSheen.style.removeProperty('--sheen-pos');
        }
        if (bSheen) {
          bSheen.style.removeProperty('--sheen-opacity');
          bSheen.style.removeProperty('--sheen-pos');
        }
      }
    };

    const getBookTransformForProgress = (dir, fromSpread, progress) => {
      let shiftX = 0;
      let scale = 1;
      if (dir === 'next') {
        if (fromSpread === 0) {
          shiftX = -25 + 25 * progress;
          scale = coverScale - (coverScale - 1) * progress;
        } else if (fromSpread === this.maxSpread - 1) {
          shiftX = 25 * progress;
          scale = 1 + (coverScale - 1) * progress;
        }
      } else {
        if (fromSpread === 1) {
          shiftX = -25 * progress;
          scale = 1 + (coverScale - 1) * progress;
        } else if (fromSpread === this.maxSpread) {
          shiftX = 25 * (1 - progress);
          scale = coverScale - (coverScale - 1) * progress;
        }
      }
      return `scale(${scale.toFixed(3)}) translateX(${shiftX.toFixed(2)}%)`;
    };

    this.viewportEl.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.clearCascade();
      pointerActive = true;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startTime = performance.now();
      isHorizontalDrag = false;
      dragAborted = false;
      dragDir = null;
      activeLeafIdx = -1;
      dragProgress = 0;
      lastDx = 0;
      rect = this.viewportEl.getBoundingClientRect();
    });

    this.viewportEl.addEventListener('pointermove', (e) => {
      if (!pointerActive || e.pointerId !== pointerId || dragAborted) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      lastDx = dx;

      if (!isHorizontalDrag) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
          dragAborted = true;
          return;
        }
        if (Math.abs(dx) > 8 && Math.abs(dx) >= Math.abs(dy)) {
          // Determine intended direction from swipe
          if (dx < 0 && this.currentSpread < this.maxSpread) {
            dragDir = 'next';
            activeLeafIdx = this.currentSpread;
          } else if (dx > 0 && this.currentSpread > 0) {
            dragDir = 'prev';
            activeLeafIdx = this.currentSpread - 1;
          } else {
            dragAborted = true;
            return;
          }

          isHorizontalDrag = true;
          this.stopAutoPlay(true);
          this.preloadAround(this.currentSpread + (dragDir === 'next' ? 1 : -1));
          this.viewportEl.classList.remove('hover-next', 'hover-prev');
          this.viewportEl.classList.add('is-dragging');
          this.bookEl.classList.add('is-dragging');
          try { this.viewportEl.setPointerCapture(pointerId); } catch (_) {}

          const leaf = this.leafEls[activeLeafIdx];
          if (leaf) {
            this.clearLeafTimer(activeLeafIdx);
            leaf.classList.add('is-dragging');
            leaf.style.zIndex = String(40 + (++this.turnSeq % 20));
          }
        }
      }

      if (isHorizontalDrag && activeLeafIdx >= 0) {
        const halfW = Math.max(120, rect.width * 0.5);
        const rawProgress = dragDir === 'next' ? (-dx / (halfW * 1.05)) : (dx / (halfW * 1.05));
        dragProgress = Math.max(0, Math.min(1, rawProgress));

        const angle = dragDir === 'next'
          ? -180 * dragProgress
          : -180 * (1 - dragProgress);

        const leaf = this.leafEls[activeLeafIdx];
        if (leaf) {
          leaf.style.transform = `rotateY(${angle.toFixed(2)}deg)`;
          const midShade = Math.sin(dragProgress * Math.PI) * 0.28;
          const sheenAlpha = Math.sin(dragProgress * Math.PI) * 0.78;
          const sheenPos = dragDir === 'next' ? (85 - dragProgress * 70) : (15 + dragProgress * 70);

          const fShade = leaf.querySelector('.alb-front .alb-turn-shade');
          const bShade = leaf.querySelector('.alb-back .alb-turn-shade');
          const fSheen = leaf.querySelector('.alb-front .alb-page-sheen');
          const bSheen = leaf.querySelector('.alb-back .alb-page-sheen');
          if (fShade) fShade.style.setProperty('--shade-opacity', midShade.toFixed(3));
          if (bShade) bShade.style.setProperty('--shade-opacity', midShade.toFixed(3));
          if (fSheen) {
            fSheen.style.setProperty('--sheen-opacity', sheenAlpha.toFixed(3));
            fSheen.style.setProperty('--sheen-pos', `${sheenPos.toFixed(1)}%`);
          }
          if (bSheen) {
            bSheen.style.setProperty('--sheen-opacity', sheenAlpha.toFixed(3));
            bSheen.style.setProperty('--sheen-pos', `${sheenPos.toFixed(1)}%`);
          }
        }

        this.bookEl.style.transform = getBookTransformForProgress(dragDir, this.currentSpread, dragProgress);
      }
    });

    const endPointer = (e) => {
      if (!pointerActive || e.pointerId !== pointerId) return;
      pointerActive = false;

      if (isHorizontalDrag) {
        const elapsed = Math.max(16, performance.now() - startTime);
        const velocity = Math.abs(lastDx) / elapsed;
        const shouldCommit = dragProgress > 0.26 || (velocity > 0.35 && dragProgress > 0.08);
        const target = shouldCommit
          ? (dragDir === 'next' ? this.currentSpread + 1 : this.currentSpread - 1)
          : this.currentSpread;

        const turningLeaf = activeLeafIdx;
        const dirName = dragDir === 'next' ? 'forward' : 'backward';
        resetInlineDragStyles();
        if (turningLeaf >= 0) {
          this.markTurning(turningLeaf, shouldCommit ? dirName : null);
        }
        this.setSpread(target, { animate: true, skipMarkTurning: true });
        this.scheduleAutoResume();
      } else if (!dragAborted && e.type === 'pointerup') {
        // Simple tap / click to turn page
        const clickX = e.clientX - (rect ? rect.left : 0);
        const width = rect ? rect.width : this.viewportEl.clientWidth;
        const relX = width > 0 ? clickX / width : 0.5;
        this.pauseForUserInteraction();

        if (this.currentSpread === 0) {
          this.next();
        } else if (this.currentSpread === this.maxSpread) {
          this.prev();
        } else if (relX >= 0.5) {
          this.next();
        } else {
          this.prev();
        }
      }

      try {
        if (this.viewportEl.hasPointerCapture(pointerId)) {
          this.viewportEl.releasePointerCapture(pointerId);
        }
      } catch (_) {}
    };

    this.viewportEl.addEventListener('pointerup', endPointer);
    this.viewportEl.addEventListener('pointercancel', (e) => {
      if (!pointerActive || e.pointerId !== pointerId) return;
      pointerActive = false;
      if (isHorizontalDrag) {
        resetInlineDragStyles();
        this.applyState({ animate: false });
        this.scheduleAutoResume();
      }
    });
  }

  ensureLeafLoaded(idx) {
    const leaf = this.leafEls[idx];
    if (!leaf) return;
    leaf.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }

  preloadAround(spreadIdx) {
    for (let i = spreadIdx - 2; i <= spreadIdx + 2; i++) {
      if (i >= 0 && i < this.totalLeaves) {
        this.ensureLeafLoaded(i);
      }
    }
  }

  preloadAllRemaining() {
    for (let i = 0; i < this.totalLeaves; i++) {
      this.ensureLeafLoaded(i);
    }
  }

  clearLeafTimer(idx) {
    const existing = this.leafTimers.get(idx);
    if (existing) {
      clearTimeout(existing);
      this.leafTimers.delete(idx);
    }
  }

  markTurning(idx, dir = null) {
    const leaf = this.leafEls[idx];
    if (!leaf) return;
    this.clearLeafTimer(idx);
    leaf.dataset.turning = '1';
    if (dir) {
      leaf.dataset.turningDir = dir;
    } else {
      delete leaf.dataset.turningDir;
    }
    leaf.style.zIndex = String(40 + (++this.turnSeq % 20));

    const timer = setTimeout(() => {
      delete leaf.dataset.turning;
      delete leaf.dataset.turningDir;
      this.leafTimers.delete(idx);
      leaf.style.zIndex = idx < this.currentSpread
        ? String(idx + 1)
        : String(this.totalLeaves - idx);
    }, 790);
    this.leafTimers.set(idx, timer);
  }

  clearCascade() {
    while (this.cascadeTimers.length) {
      clearTimeout(this.cascadeTimers.pop());
    }
  }

  setSpread(targetSpread, options = {}) {
    const clamped = Math.max(0, Math.min(this.maxSpread, targetSpread));
    const prevSpread = this.currentSpread;
    const animate = options.animate !== false;

    if (clamped !== prevSpread && !options.skipMarkTurning) {
      if (clamped > prevSpread) {
        for (let i = prevSpread; i < clamped; i++) {
          this.markTurning(i, 'forward');
        }
      } else {
        for (let i = prevSpread - 1; i >= clamped; i--) {
          this.markTurning(i, 'backward');
        }
      }
    }

    this.currentSpread = clamped;
    this.preloadAround(clamped);
    this.applyState({ animate });

    if (clamped !== prevSpread && animate && !options.silentSync) {
      playPageFlipAudio();
    }

    if (this.onSpreadChange && !options.silentSync) {
      this.onSpreadChange(clamped);
    }
  }

  next() {
    if (this.currentSpread < this.maxSpread) {
      this.clearCascade();
      this.setSpread(this.currentSpread + 1, { animate: true });
    }
  }

  prev() {
    if (this.currentSpread > 0) {
      this.clearCascade();
      this.setSpread(this.currentSpread - 1, { animate: true });
    }
  }

  jumpTo(targetSpread) {
    const clamped = Math.max(0, Math.min(this.maxSpread, targetSpread));
    if (clamped === this.currentSpread) return;

    this.clearCascade();
    const diff = clamped - this.currentSpread;
    const absDiff = Math.abs(diff);

    if (absDiff <= 1) {
      this.setSpread(clamped, { animate: true });
      return;
    }

    const dir = diff > 0 ? 1 : -1;
    // If far away (> 4 spreads), snap cleanly to 3 pages before target then cascade flip
    if (absDiff > 4) {
      const intermediate = clamped - 3 * dir;
      this.currentSpread = intermediate;
      this.preloadAround(intermediate);
      this.applyState({ animate: false });
      void this.bookEl.offsetWidth;
    }

    const stepsRemaining = Math.abs(clamped - this.currentSpread);
    for (let s = 1; s <= stepsRemaining; s++) {
      const stepTarget = this.currentSpread + s * dir;
      const timer = setTimeout(() => {
        this.setSpread(stepTarget, { animate: true });
      }, (s - 1) * 115);
      this.cascadeTimers.push(timer);
    }
  }

  applyState({ animate = true } = {}) {
    if (!animate) {
      this.bookEl.classList.add('is-dragging');
      this.leafEls.forEach((l, idx) => {
        l.classList.add('is-dragging');
        this.clearLeafTimer(idx);
        delete l.dataset.turning;
        delete l.dataset.turningDir;
      });
    }

    // Book centering state
    this.bookEl.classList.remove('is-cover-front', 'is-open', 'is-cover-back');
    if (this.currentSpread === 0) {
      this.bookEl.classList.add('is-cover-front');
      this.viewportEl.classList.remove('hover-prev');
    } else if (this.currentSpread === this.maxSpread) {
      this.bookEl.classList.add('is-cover-back');
      this.viewportEl.classList.remove('hover-next');
    } else {
      this.bookEl.classList.add('is-open');
    }

    // Update each leaf flip state & z-index
    this.leafEls.forEach((leaf, idx) => {
      const isFlipped = idx < this.currentSpread;
      leaf.classList.toggle('is-flipped', isFlipped);

      const isActiveRight = idx === this.currentSpread && this.currentSpread < this.maxSpread;
      const isActiveLeft = idx === this.currentSpread - 1 && this.currentSpread > 0;
      leaf.classList.toggle('is-active-right', isActiveRight);
      leaf.classList.toggle('is-active-left', isActiveLeft);
      leaf.classList.toggle('is-interactive', isActiveRight || isActiveLeft);

      if (!leaf.dataset.turning) {
        leaf.style.zIndex = isFlipped
          ? String(idx + 1)
          : String(this.totalLeaves - idx);
      }
    });

    if (!animate) {
      void this.bookEl.offsetWidth;
      this.bookEl.classList.remove('is-dragging');
      this.leafEls.forEach(l => l.classList.remove('is-dragging'));
    }

    // Update dynamic paper thickness stacks
    if (this.stackLeftEl) {
      const leftThickness = this.currentSpread === 0 ? 0 : Math.min(7, Math.max(2, Math.round(this.currentSpread * 0.55)));
      this.stackLeftEl.style.width = `${leftThickness}px`;
      this.stackLeftEl.style.opacity = this.currentSpread === 0 ? '0' : '1';
    }
    if (this.stackRightEl) {
      const rightCount = this.maxSpread - this.currentSpread;
      const rightThickness = rightCount === 0 ? 0 : Math.min(7, Math.max(2, Math.round(rightCount * 0.55)));
      this.stackRightEl.style.width = `${rightThickness}px`;
      this.stackRightEl.style.opacity = rightCount === 0 ? '0' : '1';
    }

    // Update Cover CTA visibility
    if (this.coverCtaEl) {
      this.coverCtaEl.classList.toggle('hidden', this.currentSpread !== 0);
    }

    // Update text labels & buttons
    const meta = ALBUM_SPREAD_META[this.currentSpread] || ALBUM_SPREAD_META[0];
    if (this.titleEl) this.titleEl.textContent = meta.title;
    if (this.counterEl) this.counterEl.textContent = meta.counter;
    if (this.prevBtn) this.prevBtn.disabled = this.currentSpread <= 0;
    if (this.nextBtn) this.nextBtn.disabled = this.currentSpread >= this.maxSpread;

    // Update active thumbnail & gently keep it in view inside filmstrip
    if (this.thumbStripEl) {
      const thumbs = this.thumbStripEl.querySelectorAll('.alb-thumb-item');
      thumbs.forEach((btn, idx) => {
        const isActive = idx === this.currentSpread;
        btn.classList.toggle('active', isActive);
        if (isActive && btn.offsetParent !== null) {
          const strip = this.thumbStripEl;
          const targetScroll = btn.offsetLeft - (strip.clientWidth / 2) + (btn.clientWidth / 2);
          strip.scrollTo({ left: Math.max(0, targetScroll), behavior: animate ? 'smooth' : 'auto' });
        }
      });
    }
  }

  startAutoPlay({ immediate = false } = {}) {
    this.stopAutoPlay(true);
    this.isAutoPlaying = true;
    this.updateAutoPlayUI(true);

    const advance = () => {
      if (this.currentSpread < this.maxSpread) {
        this.setSpread(this.currentSpread + 1, { animate: true });
      } else {
        this.jumpTo(0);
      }
    };

    if (immediate) {
      this.autoFirstTickTimer = setTimeout(() => {
        this.autoFirstTickTimer = null;
        if (!this.isAutoPlaying) return;
        advance();
        this.autoPlayTimer = setInterval(advance, this.autoIntervalMs);
      }, 750);
    } else {
      if (this.currentSpread >= this.maxSpread) {
        this.jumpTo(0);
      }
      this.autoPlayTimer = setInterval(advance, this.autoIntervalMs);
    }
  }

  stopAutoPlay(clearResume = true) {
    if (this.autoFirstTickTimer) {
      clearTimeout(this.autoFirstTickTimer);
      this.autoFirstTickTimer = null;
    }
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    if (clearResume && this.autoResumeTimer) {
      clearTimeout(this.autoResumeTimer);
      this.autoResumeTimer = null;
    }
    if (this.isAutoPlaying) {
      this.isAutoPlaying = false;
      this.updateAutoPlayUI(false);
    }
  }

  scheduleAutoResume() {
    if (!this.autoResumeMs) return;
    if (this.autoResumeTimer) {
      clearTimeout(this.autoResumeTimer);
      this.autoResumeTimer = null;
    }
    this.autoResumeTimer = setTimeout(() => {
      this.autoResumeTimer = null;
      if (this.canAutoResume && !this.canAutoResume()) return;
      this.startAutoPlay({ immediate: false });
    }, this.autoResumeMs);
  }

  pauseForUserInteraction() {
    this.stopAutoPlay(true);
    this.scheduleAutoResume();
  }

  toggleAutoPlay() {
    if (this.isAutoPlaying) {
      this.stopAutoPlay(true);
    } else {
      this.startAutoPlay({ immediate: this.currentSpread === 0 });
    }
  }

  updateAutoPlayUI(playing) {
    if (this.autoBtn) this.autoBtn.classList.toggle('is-playing', playing);
    if (this.autoIconEl) this.autoIconEl.textContent = playing ? '⏸' : '▶';
    if (this.autoTextEl) this.autoTextEl.textContent = playing ? 'Đang lật' : 'Tự lật';
  }
}

// =============================================================================
// 6. CONFETTI CELEBRATION
// =============================================================================
function launchConfetti() {
  const colors = ['#C5A059', '#6E9E6C', '#FFFFFF', '#EBF5EA', '#FF9AA6', '#FF4969'];
  const confettiCount = 55;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '99999';
  document.body.appendChild(container);

  for (let i = 0; i < confettiCount; i++) {
    const el = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 8 + 6;
    const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 260;
    const startY = window.innerHeight / 2 - 40;

    el.style.position = 'absolute';
    el.style.left = `${startX}px`;
    el.style.top = `${startY}px`;
    el.style.width = `${size}px`;
    el.style.height = `${size * (Math.random() > 0.5 ? 1.4 : 1)}px`;
    el.style.backgroundColor = color;
    el.style.borderRadius = Math.random() > 0.4 ? '2px' : '50%';
    el.style.opacity = '1';
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
    el.style.transition = 'all 2.2s cubic-bezier(0.25, 1, 0.5, 1)';

    container.appendChild(el);

    const destX = startX + (Math.random() - 0.5) * 500;
    const destY = startY + Math.random() * 450 + 120;
    const rot = Math.random() * 720 - 360;

    setTimeout(() => {
      el.style.left = `${destX}px`;
      el.style.top = `${destY}px`;
      el.style.opacity = '0';
      el.style.transform = `rotate(${rot}deg) scale(0.6)`;
    }, 20);
  }

  setTimeout(() => container.remove(), 2400);
}

// =============================================================================
// 7. TOAST NOTIFICATION UTILITY
// =============================================================================
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// =============================================================================
// 8. MAIN INITIALIZATION & DOM CONTROLLERS
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Engines
  const weddingMusic = new WeddingBgMusicEngine('weddingBgMusic');
  const autoScroll = new AutoScrollEngine('mainScrollContainer');
  const danmaku = new DanmakuEngine('blessing-box');
  const coverflow = new CoverflowSlider('coverflowWrapper');

  // --- PERSONALIZED GUEST & BACKEND SYNC ---
  let currentGuest = null;

  async function checkPersonalizedGuest() {
    const urlParams = new URLSearchParams(window.location.search);
    const guestCode = urlParams.get('to') || urlParams.get('code') || urlParams.get('guest');
    if (!guestCode) return;

    try {
      const res = await fetch(`/api/guests/lookup?code=${encodeURIComponent(guestCode)}`);
      if (!res.ok) return;
      const json = await res.json();
      const guest = json.data || json;
      if (!guest || !guest.name) return;

      currentGuest = guest;

      // 1. Update Cover Screen Greeting
      const introSubGreeting = document.getElementById('introSubGreeting');
      if (introSubGreeting) {
        introSubGreeting.innerHTML = `Thân Mời: <strong style="color: #1C1917; font-weight: 600;">${guest.title || guest.name}</strong>`;
      }

      // 2. Update Invitation Letter Card
      const letterPersonalizedBox = document.getElementById('letterPersonalizedBox');
      const letterGuestName = document.getElementById('letterGuestName');
      if (letterPersonalizedBox && letterGuestName) {
        letterPersonalizedBox.style.display = 'block';
        const companionText = guest.companion ? ' & Người thương' : '';
        letterGuestName.textContent = `${guest.title || guest.name}${companionText}`;
      }

      // 3. Pre-fill RSVP Form
      const guestNameInput = document.getElementById('guestName');
      if (guestNameInput) {
        guestNameInput.value = guest.name;
      }
      if (guest.side) {
        const sideRadio = document.querySelector(`input[name="guestSide"][value="${guest.side}"]`);
        if (sideRadio) sideRadio.checked = true;
      }
      const rsvpBadge = document.getElementById('rsvpPersonalizedBadge');
      const rsvpTitle = document.getElementById('rsvpGuestTitle');
      if (rsvpBadge && rsvpTitle) {
        rsvpBadge.style.display = 'block';
        rsvpTitle.textContent = `${guest.title || guest.name}`;
      }

      // 4. Pre-fill Wish Form
      const wishSenderInput = document.getElementById('wishSender');
      const wishRelationInput = document.getElementById('wishRelation');
      if (wishSenderInput) wishSenderInput.value = guest.name;
      if (wishRelationInput) wishRelationInput.value = guest.group || (guest.side ? `Khách ${guest.side}` : '');

    } catch (err) {
      console.warn('Personalized guest lookup error:', err);
    }
  }

  // ===========================================================================
  // REAL-TIME COUNTDOWN TIMER ENGINE (ẢNH 1 - ĐẾM NGƯỢC THỜI GIAN CƯỚI)
  // ===========================================================================
  let countdownTimerInterval = null;

  function initCountdown(weddingDate, weddingTime) {
    if (countdownTimerInterval) {
      clearInterval(countdownTimerInterval);
      countdownTimerInterval = null;
    }

    const daysEl = document.getElementById('daysVal');
    const hoursEl = document.getElementById('hoursVal');
    const minsEl = document.getElementById('minutesVal');
    const secsEl = document.getElementById('secondsVal');
    const remDaysEl = document.getElementById('cdRemainingDays');

    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    // Parse target date and time
    // Fallback default: 2026-11-28T12:00:00+07:00
    let target = null;
    const timeStr = (weddingTime && weddingTime.trim().length >= 4) ? weddingTime.trim().slice(0, 5) : '12:00';
    const dateStr = (weddingDate && weddingDate.trim()) ? weddingDate.trim() : '2026-11-28';

    try {
      // Use Vietnam timezone (+07:00)
      target = new Date(`${dateStr}T${timeStr.length === 5 ? timeStr : '12:00'}:00+07:00`);
      if (isNaN(target.getTime())) {
        target = new Date(`${dateStr} ${timeStr}`);
      }
    } catch {
      target = new Date('2026-11-28T12:00:00+07:00');
    }

    if (!target || isNaN(target.getTime())) {
      target = new Date('2026-11-28T12:00:00+07:00');
    }

    function tick() {
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minsEl.textContent = '00';
        secsEl.textContent = '00';
        if (remDaysEl) remDaysEl.textContent = '0';
        return;
      }

      const totalSecs = Math.floor(diff / 1000);
      const days = Math.floor(totalSecs / 86400);
      const hours = Math.floor((totalSecs % 86400) / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      daysEl.textContent = days < 10 ? `0${days}` : String(days);
      hoursEl.textContent = hours < 10 ? `0${hours}` : String(hours);
      minsEl.textContent = mins < 10 ? `0${mins}` : String(mins);
      secsEl.textContent = secs < 10 ? `0${secs}` : String(secs);
      if (remDaysEl) remDaysEl.textContent = String(days);
    }

    // Run tick immediately and schedule every second
    tick();
    countdownTimerInterval = setInterval(tick, 1000);
  }

  // ===========================================================================
  // DYNAMIC CALENDAR GENERATOR
  // ===========================================================================
  function renderCalendar(weddingDateStr, weddingDateDisplay, lunarDateDisplay) {
    const calMatrixEl = document.getElementById('calDaysMatrix');
    const calHeaderDateEl = document.getElementById('calHeaderDateDisplay');
    const calHeaderSubEl = document.getElementById('calHeaderSubDisplay');
    if (!calMatrixEl) return;

    let targetDate = null;
    try {
      if (weddingDateStr) {
        const parts = weddingDateStr.split('-');
        if (parts.length === 3) {
          targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
      }
    } catch (e) {
      targetDate = null;
    }

    if (!targetDate || isNaN(targetDate.getTime())) {
      targetDate = new Date(2026, 10, 28); // 28 Nov 2026
    }

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();

    // Update Header Date e.g. 28.11.2026
    if (calHeaderDateEl) {
      const padM = String(month + 1).padStart(2, '0');
      const padD = String(day).padStart(2, '0');
      calHeaderDateEl.textContent = `${padD}.${padM}.${year}`;
    }

    // Update Header Sub e.g. Thứ Bảy, 10:00 AM
    if (calHeaderSubEl) {
      const dows = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dowText = dows[targetDate.getDay()] || 'Thứ Bảy';
      calHeaderSubEl.textContent = `${dowText}, 10:00 AM`;
    }

    // Days in this month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // 1st of month: 0=Sun, 1=Mon, ..., 6=Sat
    // Sunday-start grid: offset = targetDate's 1st day of month day-of-week
    const offset = new Date(year, month, 1).getDay();

    let html = '';
    for (let i = 0; i < offset; i++) {
      html += '<span class="cal-cell other-month"></span>';
    }

    for (let d = 1; d <= totalDays; d++) {
      if (d === day) {
        html += `<span class="cal-cell is-wedding-day" title="Ngày cưới trọng đại">${d}</span>`;
      } else {
        html += `<span class="cal-cell">${d}</span>`;
      }
    }

    calMatrixEl.innerHTML = html;
  }

  function updateGoogleCalendarLink(data) {
    const linkEl = document.getElementById('calGoogleCalendarLink');
    if (!linkEl) return;

    const groom = data.groomShortName || 'Duy Phương';
    const bride = data.brideShortName || 'Thùy Dương';
    const title = encodeURIComponent(`Tiệc Cưới ${groom} & ${bride}`);
    const venue = encodeURIComponent(data.venueName ? `${data.venueName}, ${data.venueAddress || ''}` : 'Gala Center');
    const details = encodeURIComponent(`Trân trọng kính mời quý khách tham dự tiệc cưới của ${groom} & ${bride}.`);

    let datePart = (data.weddingDate || '2026-11-28').replace(/-/g, '');
    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datePart}T050000Z/${datePart}T090000Z&details=${details}&location=${venue}`;
    linkEl.href = calUrl;
  }

  // ===========================================================================
  // DYNAMIC WEDDING CONFIG SYNC (ĐỒNG BỘ THÔNG TIN TỪ CÀI ĐẶT ADMIN)
  // ===========================================================================
  async function syncWeddingData() {
    try {
      const res = await fetch('/api/wedding');
      if (!res.ok) return;
      const json = await res.json();
      const data = json.data || json;
      if (!data) return;

      const groomShort = data.groomShortName || (data.groomName ? data.groomName.split(' ').slice(-2).join(' ') : 'Duy Phương');
      const brideShort = data.brideShortName || (data.brideName ? data.brideName.split(' ').slice(-2).join(' ') : 'Thùy Dương');
      const groomFull = data.groomName || 'Nguyễn Duy Phương';
      const brideFull = data.brideName || 'Lê Thùy Dương';
      const dateDisplay = data.weddingDateDisplay || '28 tháng 11, 2026';
      const dateRaw = data.weddingDate || '2026-11-28';
      const weddingTime = data.weddingTime || '12:00';
      const lunarDisplay = data.lunarDateDisplay || '20 tháng 10 năm Bính Ngọ';
      const venueName = data.venueName || 'Sảnh Grand Crystal · GALA CENTER';
      const venueAddress = data.venueAddress || '415 Hoàng Văn Thụ, Phường 2, Quận Tân Bình, TP. Hồ Chí Minh';
      const mapsUrl = data.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(venueName + ', ' + venueAddress)}`;
      const shortVenue = (venueName.includes('·') ? venueName.split('·')[1] : venueName).trim();

      // Format date like 28.11.2026
      let formattedDotDate = '28.11.2026';
      if (dateRaw && dateRaw.includes('-')) {
        const parts = dateRaw.split('-');
        if (parts.length === 3) formattedDotDate = `${parts[2]}.${parts[1]}.${parts[0]}`;
      }

      // 1. Cover
      const introGroom = document.getElementById('introGroomName');
      const introBride = document.getElementById('introBrideName');
      const introDate = document.getElementById('introWeddingDate');
      if (introGroom) introGroom.textContent = groomShort;
      if (introBride) introBride.textContent = brideShort;
      if (introDate) introDate.textContent = dateDisplay;

      // 2. Hero Section
      const heroGroom = document.getElementById('heroGroomName');
      const heroBride = document.getElementById('heroBrideName');
      const heroCallout = document.getElementById('heroCalloutDate');
      const heroKwDate = document.getElementById('heroKeywordsDate');
      const heroKwVenue = document.getElementById('heroKeywordsVenue');
      if (heroGroom) heroGroom.textContent = groomShort;
      if (heroBride) heroBride.textContent = brideShort;
      if (heroCallout) heroCallout.textContent = formattedDotDate;
      if (heroKwDate) heroKwDate.textContent = formattedDotDate;
      if (heroKwVenue) heroKwVenue.textContent = shortVenue.toUpperCase();

      // 3. Family Announcement
      const fGroomFather = document.getElementById('familyGroomFather');
      const fGroomMother = document.getElementById('familyGroomMother');
      const fGroomAddr = document.getElementById('familyGroomAddress');
      const fBrideFather = document.getElementById('familyBrideFather');
      const fBrideMother = document.getElementById('familyBrideMother');
      const fBrideAddr = document.getElementById('familyBrideAddress');
      if (fGroomFather && data.groomFather) fGroomFather.textContent = data.groomFather;
      if (fGroomMother && data.groomMother) fGroomMother.textContent = data.groomMother;
      if (fGroomAddr && data.groomAddress) fGroomAddr.textContent = data.groomAddress;
      if (fBrideFather && data.brideFather) fBrideFather.textContent = data.brideFather;
      if (fBrideMother && data.brideMother) fBrideMother.textContent = data.brideMother;
      if (fBrideAddr && data.brideAddress) fBrideAddr.textContent = data.brideAddress;

      // 4. Couple Profiles
      const profGroom = document.getElementById('profileGroomName');
      const profBride = document.getElementById('profileBrideName');
      if (profGroom) profGroom.textContent = groomFull;
      if (profBride) profBride.textContent = brideFull;

      // 5. Countdown Timer
      initCountdown(dateRaw, weddingTime);

      // 6. Calendar & Google Calendar Link
      renderCalendar(dateRaw, dateDisplay, lunarDisplay);
      updateGoogleCalendarLink(data);

      // 7. Ceremony & Reception Cards
      const cerTitle = document.getElementById('ceremonyTitleDisplay');
      const cerTime = document.getElementById('ceremonyTimeDisplay');
      const cerDate = document.getElementById('ceremonyDateDisplay');
      const cerLunar = document.getElementById('ceremonyLunarDisplay');
      const cerLoc = document.getElementById('ceremonyLocationName');
      const cerAddr = document.getElementById('ceremonyLocationAddress');
      const cerMap = document.getElementById('ceremonyMapLink');

      const ceremonyVenueLabel = data.ceremonyVenue || 'Tư Gia Nhà Trai';
      if (cerTitle) cerTitle.textContent = data.ceremonyName || 'Lễ Thành Hôn tại Tư Gia Nhà Trai';
      
      // Parse Ceremony Time and Date cleanly from config
      if (data.ceremonyTime) {
        let rawCerTime = String(data.ceremonyTime).trim();
        if (rawCerTime.includes('-')) {
          const parts = rawCerTime.split('-');
          const timePart = parts[0].trim();
          let datePart = parts.slice(1).join('-').trim();
          if (datePart.includes('30.07') || datePart.includes('30/07')) {
            datePart = dateDisplay;
          }
          if (cerTime) cerTime.textContent = timePart;
          if (cerDate) cerDate.textContent = datePart;
        } else {
          if (cerTime) cerTime.textContent = rawCerTime;
          if (cerDate) cerDate.textContent = dateDisplay;
        }
      } else {
        if (cerTime) cerTime.textContent = '09:00';
        if (cerDate) cerDate.textContent = dateDisplay;
      }

      if (cerLunar && data.lunarDateDisplay) cerLunar.textContent = `(Nhằm ngày ${data.lunarDateDisplay})`;
      if (cerLoc && data.ceremonyName) cerLoc.textContent = data.ceremonyName;
      if (cerAddr && data.ceremonyAddress) cerAddr.textContent = `${ceremonyVenueLabel} — ${data.ceremonyAddress}`;
      if (cerMap && data.ceremonyAddress) cerMap.href = `https://maps.google.com/?q=${encodeURIComponent(data.ceremonyAddress)}`;

      const recTime = document.getElementById('receptionTimeDisplay');
      const recDate = document.getElementById('receptionDateDisplay');
      const recLunar = document.getElementById('receptionLunarDisplay');
      const recVenue = document.getElementById('receptionVenueName');
      const recAddr = document.getElementById('receptionVenueAddress');
      const recMap = document.getElementById('receptionMapLink');
      const recMapBtn = document.getElementById('receptionMapBtnText');

      if (recTime) recTime.textContent = weddingTime;
      if (recDate) recDate.textContent = dateDisplay;
      if (recLunar && data.lunarDateDisplay) recLunar.textContent = `(Âm lịch: ${data.lunarDateDisplay})`;
      if (recVenue) recVenue.textContent = data.receptionName || 'Tiệc Cưới Chính Thức Tại Nhà Hàng';
      if (recAddr) recAddr.textContent = `${venueName} — ${venueAddress}`;
      if (recMap) recMap.href = mapsUrl;
      if (recMapBtn) recMapBtn.textContent = `Chỉ Đường ${shortVenue}`;

      // 8. Address Section
      const addrVenue = document.getElementById('addressVenueName');
      const addrMapLink = document.getElementById('addressMapLink');
      if (addrVenue) addrVenue.textContent = venueName;
      if (addrMapLink) addrMapLink.href = mapsUrl;

      // 9. Bank Accounts & QR Codes
      const tabGroomBtn = document.getElementById('tabGroomBtn');
      const tabBrideBtn = document.getElementById('tabBrideBtn');
      if (tabGroomBtn) tabGroomBtn.textContent = `CHÚ RỂ (${groomShort.toUpperCase()})`;
      if (tabBrideBtn) tabBrideBtn.textContent = `CÔ DÂU (${brideShort.toUpperCase()})`;

      const groomBankEl = document.getElementById('groomBankTitle');
      const groomAccEl = document.getElementById('groomAccNumber');
      const groomAccNameEl = document.getElementById('groomAccName');
      const groomQrImg = document.getElementById('groomQrImg');

      if (groomBankEl && data.groomBank) groomBankEl.textContent = data.groomBank;
      if (groomAccEl && data.groomAccount) groomAccEl.textContent = data.groomAccount;
      if (groomAccNameEl && data.groomAccountName) groomAccNameEl.textContent = data.groomAccountName.toUpperCase();
      if (groomQrImg) {
        if (data.groomQrImage && data.groomQrImage.trim()) {
          groomQrImg.src = data.groomQrImage.trim();
        } else if (data.groomAccount) {
          const bin = data.groomBank?.toLowerCase().includes('vietcombank') ? '970436' : (data.groomBank?.toLowerCase().includes('bidv') ? '970418' : '970436');
          groomQrImg.src = `https://api.vietqr.io/image/${bin}-${data.groomAccount}-compact2.png?amount=0&addInfo=Mung+cuoi+${encodeURIComponent(groomShort)}&accountName=${encodeURIComponent(data.groomAccountName || groomFull)}`;
        }
      }

      const brideBankEl = document.getElementById('brideBankTitle');
      const brideAccEl = document.getElementById('brideAccNumber');
      const brideAccNameEl = document.getElementById('brideAccName');
      const brideQrImg = document.getElementById('brideQrImg');

      if (brideBankEl && data.brideBank) brideBankEl.textContent = data.brideBank;
      if (brideAccEl && data.brideAccount) brideAccEl.textContent = data.brideAccount;
      if (brideAccNameEl && data.brideAccountName) brideAccNameEl.textContent = data.brideAccountName.toUpperCase();
      if (brideQrImg) {
        if (data.brideQrImage && data.brideQrImage.trim()) {
          brideQrImg.src = data.brideQrImage.trim();
        } else if (data.brideAccount) {
          const bin = data.brideBank?.toLowerCase().includes('bidv') ? '970418' : (data.brideBank?.toLowerCase().includes('vietcombank') ? '970436' : '970418');
          brideQrImg.src = `https://api.vietqr.io/image/${bin}-${data.brideAccount}-compact2.png?amount=0&addInfo=Mung+cuoi+${encodeURIComponent(brideShort)}&accountName=${encodeURIComponent(data.brideAccountName || brideFull)}`;
        }
      }

      // 10. Footer & Ending Couple Names
      const footerNames = document.getElementById('footerCoupleNames');
      if (footerNames) footerNames.textContent = `${groomShort} & ${brideShort}`;
      const endNames = document.querySelector('.stt-ending-names');
      if (endNames) endNames.textContent = `${groomShort} & ${brideShort}`;

      // 11. STT Big Date Display (Ceremony & Reception)
      let dayVal = '28';
      let monthVal = 'THÁNG 11';
      let dowVal = 'THỨ BẢY';
      let yearVal = '2026';

      try {
        if (dateRaw && dateRaw.includes('-')) {
          const parts = dateRaw.split('-');
          if (parts.length === 3) {
            const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            dayVal = String(parseInt(parts[2], 10));
            monthVal = `THÁNG ${parseInt(parts[1], 10)}`;
            yearVal = String(parts[0]);
            const dows = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY'];
            dowVal = dows[dt.getDay()] || 'THỨ BẢY';
          }
        }
      } catch (e) {}

      document.querySelectorAll('.stt-big-day').forEach(el => el.textContent = dayVal);
      document.querySelectorAll('.stt-month').forEach(el => el.textContent = monthVal);
      document.querySelectorAll('.stt-dow').forEach(el => el.textContent = dowVal);
      document.querySelectorAll('.stt-big-year').forEach(el => el.textContent = yearVal);

      // Hero bar date display: e.g. NOVEMBER —— 28TH
      const englishMonths = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
      let englishMonth = 'NOVEMBER';
      if (dateRaw && dateRaw.includes('-')) {
        const mIdx = parseInt(dateRaw.split('-')[1], 10) - 1;
        if (englishMonths[mIdx]) englishMonth = englishMonths[mIdx];
      }
      function getDaySuffix(d) {
        if (d > 3 && d < 21) return 'TH';
        switch (d % 10) {
          case 1:  return 'ST';
          case 2:  return 'ND';
          case 3:  return 'RD';
          default: return 'TH';
        }
      }
      if (heroCallout) {
        heroCallout.textContent = formattedDotDate;
      }

      // Update copy button data-acc attributes
      const copyGroomBtn = document.getElementById('copyGroomAccBtn');
      if (copyGroomBtn && data.groomAccount) copyGroomBtn.setAttribute('data-acc', data.groomAccount);
      const copyBrideBtn = document.getElementById('copyBrideAccBtn');
      if (copyBrideBtn && data.brideAccount) copyBrideBtn.setAttribute('data-acc', data.brideAccount);

      // 12. Dynamic Contact Information in Contact Modal
      const contactGroomName = document.getElementById('contactGroomName');
      const contactGroomMeta = document.getElementById('contactGroomMeta');
      const contactGroomCallBtn = document.getElementById('contactGroomCallBtn');
      const groomPhone = data.groomPhone || '0988 888 888';
      if (contactGroomName) contactGroomName.textContent = groomFull;
      if (contactGroomMeta) contactGroomMeta.textContent = `Chú rể · ${groomPhone}`;
      if (contactGroomCallBtn) contactGroomCallBtn.href = `tel:${groomPhone.replace(/\s+/g, '')}`;

      const contactBrideName = document.getElementById('contactBrideName');
      const contactBrideMeta = document.getElementById('contactBrideMeta');
      const contactBrideCallBtn = document.getElementById('contactBrideCallBtn');
      const bridePhone = data.bridePhone || '0977 777 777';
      if (contactBrideName) contactBrideName.textContent = brideFull;
      if (contactBrideMeta) contactBrideMeta.textContent = `Cô dâu · ${bridePhone}`;
      if (contactBrideCallBtn) contactBrideCallBtn.href = `tel:${bridePhone.replace(/\s+/g, '')}`;

      const contactGroomRepName = document.getElementById('contactGroomRepName');
      const contactGroomRepMeta = document.getElementById('contactGroomRepMeta');
      const contactGroomRepCallBtn = document.getElementById('contactGroomRepCallBtn');
      const repGroomName = data.groomRepName || data.groomFather || 'Nguyễn Đơn Cương';
      const repGroomRole = data.groomRepRole || 'Đại diện Nhà trai (Bố chú rể)';
      const repGroomPhone = data.groomRepPhone || '0912 345 678';
      if (contactGroomRepName) contactGroomRepName.textContent = repGroomName;
      if (contactGroomRepMeta) contactGroomRepMeta.textContent = `${repGroomRole} · ${repGroomPhone}`;
      if (contactGroomRepCallBtn) contactGroomRepCallBtn.href = `tel:${repGroomPhone.replace(/\s+/g, '')}`;

      const contactBrideRepName = document.getElementById('contactBrideRepName');
      const contactBrideRepMeta = document.getElementById('contactBrideRepMeta');
      const contactBrideRepCallBtn = document.getElementById('contactBrideRepCallBtn');
      const repBrideName = data.brideRepName || data.brideFather || 'Nguyễn Văn Nam';
      const repBrideRole = data.brideRepRole || 'Đại diện Nhà gái (Bố cô dâu)';
      const repBridePhone = data.brideRepPhone || '0987 654 321';
      if (contactBrideRepName) contactBrideRepName.textContent = repBrideName;
      if (contactBrideRepMeta) contactBrideRepMeta.textContent = `${repBrideRole} · ${repBridePhone}`;
      if (contactBrideRepCallBtn) contactBrideRepCallBtn.href = `tel:${repBridePhone.replace(/\s+/g, '')}`;

    } catch (err) {
      console.warn('Wedding sync error:', err);
    }
  }

  // Initial countdown kick-off with fallbacks while API loads
  initCountdown('2026-11-28', '10:00');

  // Trigger guest personalization & wedding sync
  checkPersonalizedGuest();
  syncWeddingData();

  // --- INTRO ENVELOPE COVER ENGINE (MÀN HÌNH BÌA SONG HỶ XANH) ---
  const weddingIntroCover = document.getElementById('weddingIntroCover');
  const btnOpenInvitation = document.getElementById('btnOpenInvitation');
  const reopenCoverBtn = document.getElementById('reopenCoverBtn');
  const introEnvelopeCard = document.getElementById('introEnvelopeCard');

  function openWeddingInvitation() {
    if (!weddingIntroCover || weddingIntroCover.classList.contains('opening')) return;

    // 1. Play music immediately - direct user gesture ensures browser plays audio smoothly
    if (weddingMusic) {
      weddingMusic.playWithFade(800);
    }

    // 2. Celebratory shower of hearts and confetti
    shootHearts(14);
    if (typeof launchConfetti === 'function') {
      launchConfetti();
    }

    // 3. Trigger opening transition
    weddingIntroCover.classList.add('opening');

    // 4. Trigger CineLove entrance animations on Hero Section
    const heroSection = document.getElementById('heroSection');
    if (heroSection) {
      heroSection.classList.remove('hero-animating');
      void heroSection.offsetWidth; // Reflow to guarantee animation re-triggers
      heroSection.classList.add('hero-animating');
      heroSection.classList.add('is-revealed');
    }
    const heroElements = document.querySelectorAll('#heroSection, .cl-hero-photo-wrap, .cl-hero-info, .cl-names-row, .cl-wedding-watermark');
    heroElements.forEach(el => {
      el.classList.add('is-revealed');
      el.classList.add('title-revealed');
    });

    const heroImgWrap = document.querySelector('.stt-hero-image-wrap');
    if (heroImgWrap) {
      requestAnimationFrame(() => {
        heroImgWrap.classList.add('is-photo-revealed');
      });
    }
    if (typeof window.armPhotoScrollReveal === 'function') {
      window.armPhotoScrollReveal();
    }

    // 5. Hide intro cover after transition and ensure viewport is at top
    setTimeout(() => {
      weddingIntroCover.style.display = 'none';
      const mainScroll = document.getElementById('mainScrollContainer');
      if (mainScroll) mainScroll.scrollTop = 0;
      if (typeof syncInlineAutoPlayState === 'function') syncInlineAutoPlayState();
    }, 800);
  }

  if (btnOpenInvitation) {
    btnOpenInvitation.addEventListener('click', (e) => {
      e.stopPropagation();
      openWeddingInvitation();
    });
  }

  if (introEnvelopeCard) {
    introEnvelopeCard.addEventListener('click', (e) => {
      if (e.target !== btnOpenInvitation && !btnOpenInvitation?.contains(e.target)) {
        openWeddingInvitation();
      }
    });
  }

  // Re-open envelope button
  if (reopenCoverBtn) {
    reopenCoverBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!weddingIntroCover) return;
      if (autoScroll && autoScroll.isScrolling) {
        autoScroll.stop();
      }
      if (inlineAlbum) {
        inlineAlbum.stopAutoPlay(true);
      }
      const heroImgWrap = document.querySelector('.stt-hero-image-wrap');
      if (heroImgWrap) heroImgWrap.classList.remove('is-photo-revealed');
      weddingIntroCover.style.display = 'flex';
      weddingIntroCover.classList.remove('opening');
      showToast('Đã mở lại bìa thiệp cưới ✉');
    });
  }

  // --- CINELOVE TOOLBAR: "BẮN TIM" (Shoot Hearts) ---
  const shootHeartsBtn = document.getElementById('shootHeartsBtn');
  if (shootHeartsBtn) {
    shootHeartsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      shootHearts(8);
      // Small haptic button animation
      shootHeartsBtn.style.transform = 'scale(0.9)';
      setTimeout(() => shootHeartsBtn.style.transform = '', 160);
      showToast('Đã gửi cơn mưa tim yêu thương! 💖');
    });
  }

  // --- CINELOVE TOOLBAR: LIKE BUTTON WITH LIVE COUNTER & GOOGLE SYNC ---
  const likeBtn = document.getElementById('likeButton');
  const likeBadge = document.getElementById('likeCountBadge');
  let currentLikes = parseInt(localStorage.getItem('cinelove_like_count') || '88', 10);
  if (likeBadge) likeBadge.textContent = String(currentLikes);

  // Fetch latest like count from server / Google database
  fetch('/api/likes')
    .then(r => r.json())
    .then(data => {
      if (data && data.success && typeof data.count === 'number') {
        currentLikes = data.count;
        localStorage.setItem('cinelove_like_count', String(currentLikes));
        if (likeBadge) likeBadge.textContent = String(currentLikes);
      }
    })
    .catch(() => {});

  if (likeBtn) {
    likeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentLikes += 1;
      localStorage.setItem('cinelove_like_count', String(currentLikes));
      if (likeBadge) likeBadge.textContent = String(currentLikes);

      // Heart burst
      shootHearts(4);

      // Bounce like button
      likeBtn.style.transform = 'scale(1.25)';
      setTimeout(() => likeBtn.style.transform = '', 180);
      showToast('Cảm ơn bạn đã thả tim! ❤️');

      // Persist to server and auto-sync to Google Drive / Sheet
      fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 1 })
      }).catch(err => console.warn('Sync like error:', err));
    });
  }

  // --- MODAL UTILITIES (Slide-up Bottom Sheets) ---
  function openSheet(modal) {
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeSheet(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  // Close when clicking modal backdrop
  document.querySelectorAll('.cl-bottom-sheet-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeSheet(modal);
      }
    });
  });

  // --- POPUP 1: WISH / SỔ LƯU BÚT MODAL ---
  const wishModal = document.getElementById('wishModal');
  const openWishModalBtn = document.getElementById('openWishModalBtn');
  const closeWishModalBtn = document.getElementById('closeWishModalBtn');
  const wishForm = document.getElementById('wishForm');
  const promptChips = document.getElementById('promptChips');
  const wishSender = document.getElementById('wishSender');
  const wishRelation = document.getElementById('wishRelation');
  const wishMessage = document.getElementById('wishMessage');

  if (openWishModalBtn) {
    openWishModalBtn.addEventListener('click', () => openSheet(wishModal));
  }
  if (closeWishModalBtn) {
    closeWishModalBtn.addEventListener('click', () => closeSheet(wishModal));
  }

  // Suggestion chips
  if (promptChips && wishMessage) {
    promptChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (chip) {
        wishMessage.value = chip.getAttribute('data-text');
        wishMessage.focus();
      }
    });
  }

  if (wishForm) {
    wishForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const sender = wishSender.value.trim();
      const relation = wishRelation.value.trim();
      const message = wishMessage.value.trim();

      if (!sender || !message) {
        alert('Vui lòng điền tên và lời chúc của bạn!');
        return;
      }

      // Add to live Danmaku stream immediately
      danmaku.addWish(sender, message);

      // Save to BE API
      try {
        await fetch('/api/wishes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: sender,
            relation: relation,
            text: message
          })
        });
      } catch (err) {
        console.warn('API wish save error:', err);
      }

      // Local storage fallback
      try {
        const stored = JSON.parse(localStorage.getItem('wedding_wishes') || '[]');
        stored.unshift({ author: sender, relation, text: message, time: 'Vừa xong' });
        localStorage.setItem('wedding_wishes', JSON.stringify(stored));
      } catch (err) {
        console.error(err);
      }

      // Celebrate
      launchConfetti();
      shootHearts(6);
      wishForm.reset();
      closeSheet(wishModal);
      showToast('Lời chúc của bạn đã được gửi & bay lên màn hình thiệp cưới! ❤️');
    });
  }

  // --- CHỨC NĂNG GỬI QUÀ MỪNG CƯỚI: CUỘN TRỰC TIẾP ĐẾN THÔNG TIN MỪNG CƯỚI (KHÔNG DÙNG POPUP) ---
  const openGiftModalBtn = document.getElementById('openGiftModalBtn');

  function scrollToAccountSection(e) {
    if (e) e.preventDefault();
    const target = document.getElementById('accountSection');
    if (!target) return;

    // Tự động mở accordion Nhà trai & Nhà gái nếu đang đóng để khách thấy ngay
    const accToggleGroom = document.getElementById('accToggleGroom');
    const accBodyGroom = document.getElementById('accBodyGroom');
    if (accToggleGroom && accBodyGroom && !accBodyGroom.classList.contains('show')) {
      accToggleGroom.classList.add('active');
      accBodyGroom.classList.add('show');
    }

    const accToggleBride = document.getElementById('accToggleBride');
    const accBodyBride = document.getElementById('accBodyBride');
    if (accToggleBride && accBodyBride && !accBodyBride.classList.contains('show')) {
      accToggleBride.classList.add('active');
      accBodyBride.classList.add('show');
    }

    const mainScroll = document.getElementById('mainScrollContainer');
    if (mainScroll) {
      const targetTop = target.offsetTop;
      mainScroll.scrollTo({
        top: Math.max(0, targetTop - 20),
        behavior: 'smooth'
      });
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Hiệu ứng phát sáng nhẹ báo hiệu vị trí thông tin mừng cưới
    target.classList.remove('account-section-pulse');
    void target.offsetWidth;
    target.classList.add('account-section-pulse');
    setTimeout(() => {
      target.classList.remove('account-section-pulse');
    }, 2000);
  }

  if (openGiftModalBtn) {
    openGiftModalBtn.addEventListener('click', scrollToAccountSection);
  }

  // Copy account number buttons
  document.querySelectorAll('.btn-copy-acc').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const text = targetEl.textContent.trim();
        navigator.clipboard.writeText(text).then(() => {
          const original = btn.textContent;
          btn.textContent = 'Đã chép!';
          showToast(`Đã sao chép số tài khoản: ${text}`);
          setTimeout(() => btn.textContent = original, 2000);
        }).catch(() => {
          showToast(`Số tài khoản: ${text}`);
        });
      }
    });
  });

  // --- POPUP 3: RSVP MODAL ---
  const rsvpModal = document.getElementById('rsvpModal');
  const triggerRsvpModalBtn = document.getElementById('triggerRsvpModalBtn');
  const closeRsvpModalBtn = document.getElementById('closeRsvpModalBtn');
  const rsvpForm = document.getElementById('rsvpForm');
  const choiceYes = document.getElementById('choiceYes');
  const choiceNo = document.getElementById('choiceNo');
  const guestCountRow = document.getElementById('guestCountRow');
  const decStepBtn = document.getElementById('decStepBtn');
  const incStepBtn = document.getElementById('incStepBtn');
  const guestCountInput = document.getElementById('guestCount');

  if (triggerRsvpModalBtn) {
    triggerRsvpModalBtn.addEventListener('click', () => openSheet(rsvpModal));
  }
  if (closeRsvpModalBtn) {
    closeRsvpModalBtn.addEventListener('click', () => closeSheet(rsvpModal));
  }

  // Radio Choices
  if (choiceYes && choiceNo) {
    choiceYes.addEventListener('click', () => {
      choiceYes.classList.add('active');
      choiceNo.classList.remove('active');
      if (guestCountRow) guestCountRow.style.display = 'block';
    });

    choiceNo.addEventListener('click', () => {
      choiceNo.classList.add('active');
      choiceYes.classList.remove('active');
      if (guestCountRow) guestCountRow.style.display = 'none';
    });
  }

  // Guest Stepper
  if (decStepBtn && incStepBtn && guestCountInput) {
    decStepBtn.addEventListener('click', () => {
      let val = parseInt(guestCountInput.value, 10) || 1;
      if (val > 1) guestCountInput.value = val - 1;
    });

    incStepBtn.addEventListener('click', () => {
      let val = parseInt(guestCountInput.value, 10) || 1;
      if (val < 10) guestCountInput.value = val + 1;
    });
  }

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const guestName = document.getElementById('guestName').value.trim();
      if (!guestName) {
        alert('Vui lòng nhập họ và tên của quý khách!');
        return;
      }

      const guestSide = rsvpForm.querySelector('input[name="guestSide"]:checked')?.value || 'Nhà Trai';
      const willAttend = rsvpForm.querySelector('input[name="willAttend"]:checked')?.value === 'yes';
      const count = willAttend ? (parseInt(guestCountInput.value, 10) || 1) : 0;
      const notes = (document.getElementById('rsvpNotes')?.value || '').trim();

      // Post to BE API
      try {
        await fetch('/api/rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: guestName,
            side: guestSide,
            willAttend,
            guestCount: count,
            guestCode: currentGuest?.code,
            notes
          })
        });
      } catch (err) {
        console.warn('API RSVP save error:', err);
      }

      // Local storage fallback
      try {
        const stored = JSON.parse(localStorage.getItem('wedding_rsvps') || '[]');
        stored.push({ name: guestName, side: guestSide, willAttend, guestCount: count, guestCode: currentGuest?.code, notes, timestamp: new Date().toISOString() });
        localStorage.setItem('wedding_rsvps', JSON.stringify(stored));
      } catch (err) {
        console.error(err);
      }

      launchConfetti();
      closeSheet(rsvpModal);
      if (willAttend) {
        const weddingDateStr = document.getElementById('receptionDateDisplay')?.textContent || '28.11.2026';
        showToast(`Cảm ơn ${guestName}! Hẹn gặp quý khách vào ngày ${weddingDateStr} ❤️`);
      } else {
        showToast(`Cảm ơn ${guestName} đã phản hồi. Chúc bạn luôn an khang! 🌸`);
      }
    });
  }

  // --- 3D WEDDING PHOTOBOOK ALBUM & FULLSCREEN THEATER + SINGLE-PAGE ZOOM ---
  const albumTheaterModal = document.getElementById('albumTheaterModal');
  const theaterAlbCloseBtn = document.getElementById('theaterAlbCloseBtn');
  const albOpenTheaterBtnTop = document.getElementById('albOpenTheaterBtnTop');
  const theaterAlbZoomBtn = document.getElementById('theaterAlbZoomBtn');
  const gallerySectionEl = document.getElementById('gallerySection');
  const albumScrollRoot = document.getElementById('mainScrollContainer');
  const lightboxModal = document.getElementById('lightboxModal');

  let inlineAlbum = null;
  let theaterAlbum = null;
  let isSyncingAlbums = false;
  let isGalleryInView = false;

  function isInlineAutoAllowed() {
    const introOpen = weddingIntroCover
      && weddingIntroCover.style.display !== 'none'
      && !weddingIntroCover.classList.contains('opening');
    const theaterOpen = albumTheaterModal && albumTheaterModal.classList.contains('open');
    const lightboxOpen = lightboxModal && lightboxModal.classList.contains('open');
    return isGalleryInView && !introOpen && !theaterOpen && !lightboxOpen;
  }

  function syncInlineAutoPlayState() {
    if (!inlineAlbum) return;
    if (isInlineAutoAllowed()) {
      if (!inlineAlbum.isAutoPlaying && !inlineAlbum.autoResumeTimer) {
        inlineAlbum.startAutoPlay({ immediate: inlineAlbum.currentSpread === 0 });
      }
    } else {
      inlineAlbum.stopAutoPlay(true);
    }
  }

  inlineAlbum = new WeddingFlipbook({
    viewportId: 'inlineAlbumViewport',
    bookId: 'inlineAlbumBook',
    leavesId: 'inlineAlbumLeaves',
    stackLeftId: 'inlineStackLeft',
    stackRightId: 'inlineStackRight',
    titleId: 'inlineAlbumTitle',
    coverCtaId: 'inlineCoverCta',
    autoIntervalMs: 3000,
    autoResumeMs: 5500,
    canAutoResume: isInlineAutoAllowed,
    onSpreadChange: (spreadIdx) => {
      if (isSyncingAlbums || !theaterAlbum) return;
      isSyncingAlbums = true;
      theaterAlbum.setSpread(spreadIdx, { animate: false, silentSync: true });
      isSyncingAlbums = false;
    }
  });

  if (gallerySectionEl && 'IntersectionObserver' in window) {
    const galleryObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isGalleryInView = entry.isIntersecting;
        syncInlineAutoPlayState();
      });
    }, {
      root: albumScrollRoot || null,
      threshold: 0.15
    });
    galleryObserver.observe(gallerySectionEl);
  } else if (gallerySectionEl) {
    isGalleryInView = true;
    syncInlineAutoPlayState();
  }

  theaterAlbum = new WeddingFlipbook({
    viewportId: 'theaterAlbumViewport',
    bookId: 'theaterAlbumBook',
    leavesId: 'theaterAlbumLeaves',
    stackLeftId: 'theaterStackLeft',
    stackRightId: 'theaterStackRight',
    titleId: 'theaterAlbumTitle',
    counterId: 'theaterAlbCounter',
    thumbStripId: 'theaterAlbThumbStrip',
    autoBtnId: 'theaterAlbAutoBtn',
    autoIconId: 'theaterAlbAutoIcon',
    autoTextId: 'theaterAlbAutoText',
    onSpreadChange: (spreadIdx) => {
      if (isSyncingAlbums || !inlineAlbum) return;
      isSyncingAlbums = true;
      inlineAlbum.setSpread(spreadIdx, { animate: false, silentSync: true });
      isSyncingAlbums = false;
    }
  });

  function openAlbumTheater() {
    if (!albumTheaterModal) return;
    if (inlineAlbum) inlineAlbum.stopAutoPlay(true);
    if (theaterAlbum && inlineAlbum) {
      isSyncingAlbums = true;
      theaterAlbum.setSpread(inlineAlbum.currentSpread, { animate: false, silentSync: true });
      isSyncingAlbums = false;
      theaterAlbum.preloadAllRemaining();
    }
    albumTheaterModal.classList.add('open');
    albumTheaterModal.setAttribute('aria-hidden', 'false');
  }

  function closeAlbumTheater() {
    if (!albumTheaterModal) return;
    if (theaterAlbum) theaterAlbum.stopAutoPlay(true);
    albumTheaterModal.classList.remove('open');
    albumTheaterModal.setAttribute('aria-hidden', 'true');
    syncInlineAutoPlayState();
  }

  if (albOpenTheaterBtnTop) albOpenTheaterBtnTop.addEventListener('click', openAlbumTheater);
  if (theaterAlbCloseBtn) theaterAlbCloseBtn.addEventListener('click', closeAlbumTheater);
  if (albumTheaterModal) {
    albumTheaterModal.addEventListener('click', (e) => {
      if (e.target === albumTheaterModal) closeAlbumTheater();
    });
  }

  // --- FULLSCREEN SINGLE-PAGE ZOOM LIGHTBOX ---
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxPrevBtn = document.getElementById('lightboxPrevBtn');
  const lightboxNextBtn = document.getElementById('lightboxNextBtn');

  let activeLightboxIndex = 0;

  window.openWeddingLightbox = function(index) {
    const safeIdx = Math.max(0, Math.min(ALBUM_SINGLE_PAGES.length - 1, index || 0));
    const page = ALBUM_SINGLE_PAGES[safeIdx];
    if (!page || !lightboxModal) return;
    activeLightboxIndex = safeIdx;

    if (lightboxImg) lightboxImg.src = page.src;
    if (lightboxCaption) lightboxCaption.textContent = page.caption || '';
    if (lightboxCounter) lightboxCounter.textContent = `Ảnh ${safeIdx + 1} / ${ALBUM_SINGLE_PAGES.length}`;
    if (inlineAlbum) inlineAlbum.stopAutoPlay(true);
    lightboxModal.classList.add('open');
    lightboxModal.setAttribute('aria-hidden', 'false');
  };

  function hideLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('open');
    lightboxModal.setAttribute('aria-hidden', 'true');
    syncInlineAutoPlayState();
  }

  function prevLightbox() {
    const nextIdx = (activeLightboxIndex - 1 + ALBUM_SINGLE_PAGES.length) % ALBUM_SINGLE_PAGES.length;
    window.openWeddingLightbox(nextIdx);
  }

  function nextLightbox() {
    const nextIdx = (activeLightboxIndex + 1) % ALBUM_SINGLE_PAGES.length;
    window.openWeddingLightbox(nextIdx);
  }

  function openCurrentSpreadZoom() {
    const isTheaterOpen = albumTheaterModal && albumTheaterModal.classList.contains('open');
    const activeAlbum = isTheaterOpen ? theaterAlbum : inlineAlbum;
    const spreadIdx = activeAlbum ? activeAlbum.currentSpread : 0;
    const meta = ALBUM_SPREAD_META[spreadIdx] || ALBUM_SPREAD_META[0];
    window.openWeddingLightbox(meta.zoomIdx || 0);
  }

  if (theaterAlbZoomBtn) theaterAlbZoomBtn.addEventListener('click', openCurrentSpreadZoom);

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', hideLightbox);
  if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', prevLightbox);
  if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', nextLightbox);

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) hideLightbox();
    });

    // Mobile swipe navigation inside Lightbox
    let lbTouchX = 0;
    lightboxModal.addEventListener('touchstart', (e) => {
      lbTouchX = e.touches[0].clientX;
    }, { passive: true });
    lightboxModal.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].clientX - lbTouchX;
      if (Math.abs(diff) > 45) {
        if (diff > 0) prevLightbox();
        else nextLightbox();
      }
    }, { passive: true });
  }

  // --- STT MODAL & ACCORDION & CONTACT INTERACTIONS ---
  const contactModal = document.getElementById('contactModal');
  const btnOpenContactModal = document.getElementById('btnOpenContactModal');
  const closeContactModalBtn = document.getElementById('closeContactModalBtn');
  if (btnOpenContactModal && contactModal) {
    btnOpenContactModal.addEventListener('click', () => openSheet(contactModal));
  }
  if (closeContactModalBtn && contactModal) {
    closeContactModalBtn.addEventListener('click', () => closeSheet(contactModal));
  }

  // Account section accordions
  const accToggleGroom = document.getElementById('accToggleGroom');
  const accBodyGroom = document.getElementById('accBodyGroom');
  if (accToggleGroom && accBodyGroom) {
    accToggleGroom.addEventListener('click', () => {
      accToggleGroom.classList.toggle('active');
      accBodyGroom.classList.toggle('show');
    });
  }

  const accToggleBride = document.getElementById('accToggleBride');
  const accBodyBride = document.getElementById('accBodyBride');
  if (accToggleBride && accBodyBride) {
    accToggleBride.addEventListener('click', () => {
      accToggleBride.classList.toggle('active');
      accBodyBride.classList.toggle('show');
    });
  }

  // Copy buttons in Account section
  const copyGroomAccBtn = document.getElementById('copyGroomAccBtn');
  if (copyGroomAccBtn) {
    copyGroomAccBtn.addEventListener('click', () => {
      const acc = copyGroomAccBtn.getAttribute('data-acc') || '1018899888';
      navigator.clipboard.writeText(acc).then(() => {
        showToast(`Đã sao chép STK chú rể: ${acc}`);
      }).catch(() => {
        showToast(`STK chú rể: ${acc}`);
      });
    });
  }

  const copyBrideAccBtn = document.getElementById('copyBrideAccBtn');
  if (copyBrideAccBtn) {
    copyBrideAccBtn.addEventListener('click', () => {
      const acc = copyBrideAccBtn.getAttribute('data-acc') || '68899887766';
      navigator.clipboard.writeText(acc).then(() => {
        showToast(`Đã sao chép STK cô dâu: ${acc}`);
      }).catch(() => {
        showToast(`STK cô dâu: ${acc}`);
      });
    });
  }

  // --- DESKTOP QR BADGE CLOSE BUTTON ---
  const closeQrBadgeBtn = document.getElementById('closeQrBadgeBtn');
  const qrBadgeCard = document.querySelector('.desktop-qr-card');
  if (closeQrBadgeBtn && qrBadgeCard) {
    closeQrBadgeBtn.addEventListener('click', () => {
      qrBadgeCard.style.display = 'none';
    });
  }

  // --- GLOBAL KEYBOARD SHORTCUTS ---
  window.addEventListener('keydown', (e) => {
    if (lightboxModal && lightboxModal.classList.contains('open')) {
      if (e.key === 'Escape') hideLightbox();
      if (e.key === 'ArrowLeft') prevLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
    } else if (albumTheaterModal && albumTheaterModal.classList.contains('open')) {
      if (e.key === 'Escape') closeAlbumTheater();
      if (e.key === 'ArrowLeft' && theaterAlbum) { theaterAlbum.stopAutoPlay(); theaterAlbum.prev(); }
      if (e.key === 'ArrowRight' && theaterAlbum) { theaterAlbum.stopAutoPlay(); theaterAlbum.next(); }
    } else if (e.key === 'Escape') {
      [wishModal, rsvpModal, contactModal].forEach(modal => {
        if (modal && modal.classList.contains('open')) closeSheet(modal);
      });
    }
  });

  // --- SCROLL REVEAL & TITLE FLY-IN ENTRANCE OBSERVER ---
  const revealTargets = document.querySelectorAll(`
    .cl-hero-photo-wrap,
    .cl-hero-info,
    .cl-letter-card,
    .cl-music-section,
    .cl-music-card,
    .cl-section-head,
    .cl-family-box,
    .cl-couple-cards .cl-person-card,
    .cl-film-countdown-section,
    .cl-kodak-frame,
    .cl-minimal-countdown,
    .cl-calendar-section,
    .cl-calendar-card,
    .cl-events-section,
    .cl-event-card,
    .coverflow-carousel-wrapper,
    .cl-dresscode-section,
    .cl-dresscode-card,
    .cl-address-section,
    .cl-map-box,
    .cl-footer-section
  `);

  revealTargets.forEach(target => {
    target.classList.add('cl-scroll-reveal');
  });

  // Stagger Groom (left) and Bride (right)
  const groomCard = document.querySelector('.cl-couple-cards .cl-person-card:first-child');
  const brideCard = document.querySelector('.cl-couple-cards .cl-person-card:last-child');
  if (groomCard) groomCard.classList.add('reveal-left');
  if (brideCard) brideCard.classList.add('reveal-right');

  const mainScrollBox = document.getElementById('mainScrollContainer');
  if ('IntersectionObserver' in window && revealTargets.length > 0) {
    const scrollRevealObserver = new IntersectionObserver((entries) => {
      const rootRect = mainScrollBox
        ? mainScrollBox.getBoundingClientRect()
        : { top: 0, bottom: window.innerHeight };

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          entry.target.classList.add('title-revealed');
        } else {
          const r = entry.boundingClientRect;
          if (r.bottom <= rootRect.top || r.top >= rootRect.bottom) {
            entry.target.classList.remove('is-revealed');
            entry.target.classList.remove('title-revealed');
          }
        }
      });
    }, {
      root: mainScrollBox || null,
      threshold: 0.08,
      rootMargin: '0px 0px -20px 0px'
    });

    revealTargets.forEach(target => scrollRevealObserver.observe(target));
  } else {
    // Fallback if IntersectionObserver is not supported
    revealTargets.forEach(target => {
      target.classList.add('is-revealed');
      target.classList.add('title-revealed');
    });
  }

  // --- EDITORIAL PHOTO SCROLL REVEAL OBSERVER (HIỆU ỨNG HIỆN ẢNH MƯỢT KHI CUỘN LÊN & XUỐNG) ---
  const heroPhotoWrap = document.querySelector('.stt-hero-image-wrap');
  let photoRevealArmed = !weddingIntroCover || weddingIntroCover.style.display === 'none';

  if (heroPhotoWrap) {
    heroPhotoWrap.classList.add('stt-photo-reveal');
    if (photoRevealArmed) {
      requestAnimationFrame(() => heroPhotoWrap.classList.add('is-photo-revealed'));
    }
  }

  const photoRevealTargets = Array.from(document.querySelectorAll(`
    .stt-statement-img-wrap,
    .stt-profile-card,
    .stt-middle-photo-wrap,
    #inlineAlbumWrapper,
    .stt-qr-box,
    .stt-ending-section
  `));

  if (photoRevealTargets.length > 0) {
    photoRevealTargets.forEach(el => el.classList.add('stt-photo-reveal'));

    // Warm-decode showcase photos shortly after load so animations never stutter on scroll
    setTimeout(() => {
      document.querySelectorAll('.stt-photo-reveal img').forEach(img => {
        if (img.src && typeof img.decode === 'function') {
          img.decode().catch(() => {});
        }
      });
    }, 350);

    let photoObserver = null;

    const setPhotoRevealed = (el, isVisible) => {
      if (!el || !photoRevealArmed) return;
      if (isVisible) {
        el.classList.add('is-photo-revealed');
      } else {
        el.classList.remove('is-photo-revealed');
      }
    };

    const checkVisiblePhotoTargets = () => {
      if (!photoRevealArmed) return;
      const rootRect = mainScrollBox
        ? mainScrollBox.getBoundingClientRect()
        : { top: 0, bottom: window.innerHeight };
      const triggerTop = rootRect.top;
      const triggerBottom = rootRect.bottom - 24;

      photoRevealTargets.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.height > 0) {
          if (r.top <= triggerBottom && r.bottom >= triggerTop) {
            setPhotoRevealed(el, true);
          } else if (r.bottom < triggerTop - 15 || r.top > rootRect.bottom + 15) {
            setPhotoRevealed(el, false);
          }
        }
      });

      // Also check hero if user scrolled back up to top
      if (heroPhotoWrap) {
        const hr = heroPhotoWrap.getBoundingClientRect();
        if (hr.bottom >= triggerTop && hr.top <= triggerBottom) {
          heroPhotoWrap.classList.add('is-photo-revealed');
        } else if (hr.bottom < triggerTop - 15) {
          heroPhotoWrap.classList.remove('is-photo-revealed');
        }
      }
    };

    window.armPhotoScrollReveal = () => {
      photoRevealArmed = true;
      requestAnimationFrame(checkVisiblePhotoTargets);
    };

    if ('IntersectionObserver' in window) {
      photoObserver = new IntersectionObserver((entries) => {
        if (!photoRevealArmed) return;
        const rootRect = mainScrollBox
          ? mainScrollBox.getBoundingClientRect()
          : { top: 0, bottom: window.innerHeight };

        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setPhotoRevealed(entry.target, true);
          } else {
            const r = entry.boundingClientRect;
            if (r.bottom <= rootRect.top || r.top >= rootRect.bottom) {
              setPhotoRevealed(entry.target, false);
            }
          }
        });
      }, {
        root: mainScrollBox || null,
        threshold: 0.10,
        rootMargin: '0px 0px -28px 0px'
      });

      photoRevealTargets.forEach(el => photoObserver.observe(el));
      if (heroPhotoWrap) photoObserver.observe(heroPhotoWrap);

      if (mainScrollBox) {
        let rafPending = false;
        mainScrollBox.addEventListener('scroll', () => {
          if (!photoRevealArmed || rafPending) return;
          rafPending = true;
          requestAnimationFrame(() => {
            rafPending = false;
            checkVisiblePhotoTargets();
          });
        }, { passive: true });
      }
    } else {
      photoRevealArmed = true;
      photoRevealTargets.forEach(el => setPhotoRevealed(el, true));
    }
  }
});
