/**
 * THIỆP CƯỚI — INTERACTIVE ENGINE
 * Nội dung, ảnh, nhạc, màu đọc từ wedding.config.js (không sửa file này để đổi nội dung).
 *
 * Tính năng:
 * 1. Nhạc nền + lời chạy (file .lrc)
 * 2. Tự động cuộn trong .main-scroll-container
 * 3. Lời chúc bay (danmaku)
 * 4. Bắn tim, confetti
 * 5. Album lật trang 3D (WeddingFlipbook) + xem toàn màn hình + phóng to từng trang
 * 6. Bottom sheet: gửi lời chúc, RSVP, liên hệ; mừng cưới VietQR
 * 7. Đếm ngược, lịch tháng, hiện dần khi cuộn
 */
import config from '../wedding.config.js';
import * as api from './api.js';
import { loadLrc } from './lrc.js';
import {
  applySections,
  renderStatic,
  renderGifts,
  renderEvents,
  renderGuest,
  renderCalendar,
  startCountdown,
  buildAlbum,
} from './render.js';

const MUSIC = config.music || {};

// =============================================================================
// 1. NHẠC NỀN & LỜI BÀI HÁT CHẠY THEO NHẠC
// =============================================================================
class WeddingBgMusicEngine {
  constructor(audioElementId = 'weddingBgMusic') {
    this.audio = document.getElementById(audioElementId);
    this.isPlaying = false;
    this.hasUnlocked = false;
    this.fadeInterval = null;
    this.targetVolume = 0.85;
    this.currentLyricIndex = -1;
    this.lyricElements = [];
    this.lyrics = [];

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
    if (!this.audio || !MUSIC.src) return;

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

    this.lyrics.forEach((item, index) => {
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

  setLyrics(list) {
    this.lyrics = Array.isArray(list) ? list : [];
    this.currentLyricIndex = -1;
    this.renderLyrics();
    const container = this.lyricsContainer;
    if (container && !this.lyrics.length) container.hidden = true;
  }

  updateLyrics(currentTime, forceScroll = false) {
    if (!this.lyricElements || this.lyricElements.length === 0) return;

    let activeIdx = -1;
    for (let i = 0; i < this.lyrics.length; i++) {
      if (currentTime >= this.lyrics[i].time) {
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
        showToast(`Đang phát: ${[MUSIC.title, MUSIC.artist].filter(Boolean).join(' — ')} 🎵`);
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
        showToast('Đã xem trọn vẹn thiệp cưới! Cảm ơn bạn ❤️');
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
// 3. LỜI CHÚC BAY (DANMAKU) — dạng feed chat: tối đa 2 thẻ, bong bóng mới
//    hiện ở dưới, các bong bóng cũ trượt lên đúng chiều cao của nó (chỉ animate
//    transform/opacity, không reflow), cái trên cùng mờ dần rồi mới gỡ.
// =============================================================================
/** Bỏ thẻ HTML và khoảng trắng thừa — lời chúc chỉ là chữ thường. */
const plainText = (s) => String(s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

const SAMPLE_WISHES = [
  { author: '', text: 'Trăm năm hạnh phúc, mãi ngọt ngào! 🌸' },
  { author: '', text: 'Chúc hai bạn xứng đôi vừa lứa, bạc đầu răng long ❤️' },
  { author: '', text: 'Chúc mừng hạnh phúc! 囍' },
  { author: '', text: 'Mãi yêu nhau như ngày đầu nhé 💐' },
  { author: '', text: 'Vạn sự như ý, gia đạo an khang ✨' },
];

class DanmakuEngine {
  constructor(containerId = 'blessing-box', { enabled = true } = {}) {
    this.container = document.getElementById(containerId);
    this.enabled = enabled && !!this.container && !this.container.hidden;
    this.pool = [];
    this.poolIndex = 0;
    this.items = []; // bong bóng đang hiện, cũ → mới
    this.maxVisible = 2; // thẻ lời chúc cao ~50–66px: 2 thẻ vừa khung, ít che nội dung
    this.gap = 6;
    this.lifetime = 9000; // ms mỗi bong bóng
    this.interval = 3600; // ms giữa hai bong bóng
    this.timer = null;
    this.reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.init();
  }

  init() {
    if (!this.enabled) return;
    // Chỉ một engine cho mỗi khung (tránh hai vòng lặp chạy song song làm bong bóng chồng nhau)
    if (this.container.__danmaku) this.container.__danmaku.destroy();
    this.container.__danmaku = this;
    this.loadWishes();
    // Dừng hẳn khi tab ẩn (tránh dồn nhiều bong bóng khi quay lại)
    this.onVisibility = () => {
      if (document.hidden) this.stopLoop();
      else this.startLoop(1500);
    };
    document.addEventListener('visibilitychange', this.onVisibility);
    this.startLoop(1500);
  }

  async loadWishes() {
    const list = await api.fetchWishes();
    const real = list
      .map((w) => ({ author: plainText(w && w.author), relation: plainText(w && w.relation), text: plainText(w && w.text) }))
      .filter((w) => w.author && w.text);
    // Còn ít lời chúc thật thì xen thêm vài câu chúc chung (không gắn tên người)
    this.pool = real.length >= 3 ? real : [...real, ...SAMPLE_WISHES];
    this.poolIndex = Math.floor(Math.random() * this.pool.length);
  }

  /** Không chạy khi bìa thư đang mở, đang mở bottom sheet / album / ảnh phóng to. */
  isPaused() {
    if (document.hidden) return true;
    const cover = document.getElementById('weddingIntroCover');
    if (cover && cover.style.display !== 'none' && !cover.hidden) return true;
    return !!document.querySelector('.cl-bottom-sheet-backdrop.open, .alb-theater-modal.open, .lightbox-modal.open');
  }

  startLoop(delay = this.interval) {
    this.stopLoop();
    this.timer = setTimeout(() => {
      this.timer = null;
      if (!this.isPaused()) this.spawnNext();
      this.startLoop(this.reduceMotion ? this.interval * 1.6 : this.interval + Math.random() * 900);
    }, delay);
  }

  stopLoop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  destroy() {
    this.stopLoop();
    this.enabled = false;
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.items.forEach((it) => clearTimeout(it.timer));
    this.items = [];
    this.container.replaceChildren();
  }

  spawnNext() {
    const pool = this.pool.length ? this.pool : SAMPLE_WISHES;
    // Bỏ qua lời chúc đang hiện trên màn hình (không lặp lại liền nhau)
    const showing = new Set(this.items.map((it) => it.key));
    for (let tries = 0; tries < pool.length; tries++) {
      this.poolIndex = (this.poolIndex + 1) % pool.length;
      const w = pool[this.poolIndex];
      if (!showing.has(`${plainText(w.author)}|${plainText(w.text)}`)) {
        this.spawnBubble(w, false);
        return;
      }
    }
  }

  spawnBubble(wish, isUser = false) {
    if (!this.enabled || !wish) return;
    const author = plainText(wish.author);
    const relation = plainText(wish.relation);
    const text = plainText(wish.text);
    if (!text) return;

    // Thẻ lời chúc: ảnh đại diện chữ cái đầu + tên (quan hệ) + lời chúc
    const bubble = document.createElement('div');
    bubble.className = isUser ? 'danmaku-item is-user' : 'danmaku-item';
    const avatar = document.createElement('span');
    avatar.className = 'danmaku-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    // Chữ cái đầu của tên gọi (từ cuối: "Bác Hùng" → "H"); lời chúc chung → ♥
    const lastWord = author.split(' ').filter(Boolean).pop() || '';
    avatar.textContent = lastWord ? lastWord.charAt(0).toUpperCase() : '♥';
    const body = document.createElement('span');
    body.className = 'danmaku-body';
    const name = document.createElement('span');
    name.className = 'danmaku-name';
    name.textContent = author ? (relation ? `${author} · ${relation}` : author) : 'Lời chúc phúc';
    const msg = document.createElement('span');
    msg.className = 'danmaku-text';
    msg.textContent = text;
    body.append(name, msg);
    const shine = document.createElement('span');
    shine.className = 'danmaku-shine';
    bubble.append(shine, avatar, body);
    // Vài tim nhỏ bay lên từ ảnh đại diện (nhiều hơn với lời chúc vừa gửi)
    const sparks = isUser ? ['💖', '✨', '💕', '🌸'] : ['💗', '✨'];
    sparks.forEach((icon, i) => {
      const sp = document.createElement('span');
      sp.className = 'danmaku-spark';
      sp.setAttribute('aria-hidden', 'true');
      sp.textContent = icon;
      sp.style.setProperty('--spark-delay', `${0.45 + i * 0.25}s`);
      sp.style.setProperty('--spark-x', `${Math.round((Math.random() - 0.3) * 40)}px`);
      bubble.append(sp);
    });
    this.container.appendChild(bubble);

    const entry = { el: bubble, height: bubble.offsetHeight, timer: null, key: `${author}|${text}` };
    this.items.push(entry);
    entry.timer = setTimeout(() => this.removeItem(entry), this.lifetime);

    // Quá số lượng: cái cũ nhất mờ dần rồi gỡ
    while (this.items.length > this.maxVisible) this.removeItem(this.items[0]);

    // offsetHeight ở trên đã chốt trạng thái ban đầu (mờ, lệch xuống 14px),
    // nên đổi class/transform ngay bây giờ sẽ chạy transition mượt.
    bubble.classList.add('is-in');
    this.layout();
  }

  layout() {
    let y = 0;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.el.style.transform = `translate3d(0, ${-y}px, 0)`;
      y += it.height + this.gap;
    }
  }

  removeItem(entry) {
    const idx = this.items.indexOf(entry);
    if (idx === -1) return;
    this.items.splice(idx, 1);
    clearTimeout(entry.timer);
    entry.el.classList.add('is-out');
    setTimeout(() => entry.el.remove(), 450);
    this.layout();
  }

  addWish(author, text, relation = '') {
    const wish = { author: plainText(author), relation: plainText(relation), text: plainText(text) };
    this.pool.push(wish);
    this.poolIndex = this.pool.length - 1;
    this.spawnBubble(wish, true);
    // Cho thẻ của khách đứng đủ lâu: thẻ kế tiếp chỉ hiện sau một nhịp đầy đủ
    if (this.enabled) this.startLoop(this.interval + 1500);
  }
}

// =============================================================================
// 4. BẮN TIM
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
// 5. ALBUM LẬT TRANG 3D — dữ liệu lấy từ config.album.leaves
// =============================================================================
const ALBUM = buildAlbum(config.album?.leaves || []);
const ALBUM_LEAVES = ALBUM.leaves;
const ALBUM_SPREAD_META = ALBUM.spreads;
const ALBUM_SINGLE_PAGES = ALBUM.pages;
// Mỗi trang album chiếm ~nửa khung; trình duyệt chọn cỡ ảnh theo đó (màn retina tự lấy cỡ lớn hơn)
const ALBUM_PAGE_SIZES = '(max-width: 500px) 50vw, (orientation: landscape) 34vw, 50vw';

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
      frontDiv.className = `alb-face alb-front${leaf.frontHardcover ? ' is-hardcover' : ''}${leaf.frontFit === 'contain' ? ' is-contain' : ''}`;
      const frontImg = document.createElement('img');
      frontImg.alt = leaf.frontAlt || `Trang album`;
      frontImg.draggable = false;
      if (leaf.frontSrcset) frontImg.sizes = ALBUM_PAGE_SIZES;
      if (idx <= 2) {
        if (leaf.frontSrcset) frontImg.srcset = leaf.frontSrcset;
        frontImg.src = leaf.front;
      } else {
        if (leaf.frontSrcset) frontImg.dataset.srcset = leaf.frontSrcset;
        frontImg.dataset.src = leaf.front;
      }
      const frontShade = document.createElement('div');
      frontShade.className = 'alb-turn-shade';
      const frontSheen = document.createElement('div');
      frontSheen.className = 'alb-page-sheen';
      const cornerPeelRight = document.createElement('div');
      cornerPeelRight.className = 'alb-corner-peel peel-right';
      frontImg.addEventListener('error', () => frontDiv.classList.add('is-broken'));
      frontDiv.append(frontImg, frontShade, frontSheen, cornerPeelRight);

      // Back face (Left side page when flipped open)
      const backDiv = document.createElement('div');
      backDiv.className = `alb-face alb-back${leaf.backHardcover ? ' is-hardcover' : ''}${leaf.backFit === 'contain' ? ' is-contain' : ''}`;
      const backImg = document.createElement('img');
      backImg.alt = leaf.backAlt || `Trang album`;
      backImg.draggable = false;
      if (leaf.backSrcset) backImg.sizes = ALBUM_PAGE_SIZES;
      if (idx <= 2) {
        if (leaf.backSrcset) backImg.srcset = leaf.backSrcset;
        backImg.src = leaf.back;
      } else {
        if (leaf.backSrcset) backImg.dataset.srcset = leaf.backSrcset;
        backImg.dataset.src = leaf.back;
      }
      const backShade = document.createElement('div');
      backShade.className = 'alb-turn-shade';
      const backSheen = document.createElement('div');
      backSheen.className = 'alb-page-sheen';
      const cornerPeelLeft = document.createElement('div');
      cornerPeelLeft.className = 'alb-corner-peel peel-left';
      backImg.addEventListener('error', () => backDiv.classList.add('is-broken'));
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
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        img.removeAttribute('data-srcset');
      }
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
  // Màu theo theme (biến CSS)
  const colors = ['var(--c-accent)', 'var(--c-primary)', '#ffffff', 'var(--c-soft)', 'var(--c-accent-strong)', 'var(--c-strong)'];
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
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  // Thông báo mới thay thông báo cũ; hủy hẹn giờ cũ để không tắt sớm thông báo mới
  if (toastTimer) clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    toastTimer = null;
  }, 3000);
}


// =============================================================================
// 8. KHỞI TẠO
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // --- ĐỔ NỘI DUNG TỪ wedding.config.js ---
  const params = new URLSearchParams(window.location.search);
  const guestCode = api.normalizeCode(params.get('to') || params.get('code') || params.get('guest'));
  // Tên có dấu kèm trong link (&n=Bác%20Hùng, do Google Sheet tự sinh): hiện ngay, đúng dấu,
  // kể cả khi chưa nối backend. Nếu tra được khách trong Sheet thì dùng dữ liệu Sheet.
  const nameFromLink = String(params.get('n') || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  let currentGuest = null;

  applySections(config);
  renderStatic(config);
  renderGifts(config, null);
  renderGuest(config, null);
  const defaultMainEvent = renderEvents(config, null);
  renderCalendar(defaultMainEvent);
  startCountdown(defaultMainEvent);

  const audioEl = document.getElementById('weddingBgMusic');
  if (audioEl && MUSIC.src) {
    // Chưa có file nhạc (hoặc tải lỗi): ẩn phần nhạc thay vì để nút phát không chạy
    audioEl.addEventListener('error', () => {
      ['#musicSection', '#audio-control-wrapper', '#audioAutoplayPrompt'].forEach((sel) => {
        const node = document.querySelector(sel);
        if (node) node.hidden = true;
      });
      console.info(`[Thiệp cưới] Không tải được file nhạc "${MUSIC.src}" — đã ẩn phần nhạc.`);
    });
    audioEl.src = MUSIC.src;
  }

  // Mã QR mở thiệp trên điện thoại (chỉ hiện ở màn hình lớn)
  const desktopQrImg = document.getElementById('desktopQrImg');
  if (desktopQrImg) {
    const qrColor = getComputedStyle(document.documentElement).getPropertyValue('--c-primary').trim().replace('#', '') || '000000';
    desktopQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&color=${qrColor}&data=${encodeURIComponent(window.location.href)}`;
  }

  // --- CÁC ENGINE HIỆU ỨNG ---
  const weddingMusic = new WeddingBgMusicEngine('weddingBgMusic');
  loadLrc(MUSIC.lyrics).then((lines) => weddingMusic.setLyrics(lines));
  const autoScroll = new AutoScrollEngine('mainScrollContainer');
  const danmaku = new DanmakuEngine('blessing-box', { enabled: (config.sections || []).includes('wishes') });

  // --- KHÁCH MỜI RIÊNG (?to=ma-khach) ---
  // Chỉ có tên trong link: chào đúng tên, vẫn hiện các sự kiện chung ("public")
  if (nameFromLink) renderGuest(config, { name: nameFromLink, xungHo: '', side: '', groups: [] });

  async function applyGuest() {
    if (!guestCode) return;
    const guest = await api.lookupGuest(guestCode);
    if (!guest) return;
    currentGuest = guest;
    renderGuest(config, guest);
    renderGifts(config, guest);
    const main = renderEvents(config, guest);
    renderCalendar(main);
    startCountdown(main);
  }
  applyGuest();

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

    // Ghi nhận khách đã mở thiệp (chỉ khi có mã khách hợp lệ)
    if (currentGuest) api.trackOpen(currentGuest.code);

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


  // --- THẢ TIM (đếm trong trình duyệt này) ---
  const likeBtn = document.getElementById('likeButton');
  const likeBadge = document.getElementById('likeCountBadge');
  let currentLikes = 0;
  try {
    currentLikes = parseInt(localStorage.getItem('wedding_like_count') || '0', 10) || 0;
  } catch (_) {}
  if (likeBadge) likeBadge.textContent = String(currentLikes);

  if (likeBtn) {
    likeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentLikes += 1;
      try {
        localStorage.setItem('wedding_like_count', String(currentLikes));
      } catch (_) {}
      if (likeBadge) likeBadge.textContent = String(currentLikes);
      shootHearts(4);
      likeBtn.style.transform = 'scale(1.25)';
      setTimeout(() => (likeBtn.style.transform = ''), 180);
      showToast('Cảm ơn bạn đã thả tim! ❤️');
    });
  }

  // --- BOTTOM SHEET ---
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

  document.querySelectorAll('.cl-bottom-sheet-backdrop').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeSheet(modal);
    });
  });

  function setBusy(form, busy) {
    const btn = form.querySelector('[type="submit"]');
    if (btn) {
      btn.disabled = busy;
      btn.classList.toggle('is-busy', busy);
    }
  }

  // --- GỬI LỜI CHÚC ---
  const wishModal = document.getElementById('wishModal');
  const openWishModalBtn = document.getElementById('openWishModalBtn');
  const closeWishModalBtn = document.getElementById('closeWishModalBtn');
  const wishForm = document.getElementById('wishForm');
  const promptChips = document.getElementById('promptChips');
  const wishSender = document.getElementById('wishSender');
  const wishRelation = document.getElementById('wishRelation');
  const wishMessage = document.getElementById('wishMessage');

  if (openWishModalBtn) openWishModalBtn.addEventListener('click', () => openSheet(wishModal));
  if (closeWishModalBtn) closeWishModalBtn.addEventListener('click', () => closeSheet(wishModal));

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
      const author = plainText(wishSender.value).slice(0, 80);
      const relation = plainText(wishRelation.value).slice(0, 80);
      const text = plainText(wishMessage.value).slice(0, 500);
      const hp = document.getElementById('wishHp')?.value || '';

      if (!author || !text) {
        showToast('Vui lòng điền tên và lời chúc của bạn!');
        return;
      }

      setBusy(wishForm, true);
      const res = await api.sendWish({ code: currentGuest?.code || guestCode || '', author, relation, text, hp });
      setBusy(wishForm, false);
      if (!res || !res.success) {
        showToast((res && res.message) || 'Chưa gửi được lời chúc, vui lòng thử lại.');
        return;
      }

      danmaku.addWish(author, text, relation);
      launchConfetti();
      shootHearts(6);
      wishForm.reset();
      renderGuest(config, currentGuest);
      closeSheet(wishModal);
      showToast('Lời chúc của bạn đã được gửi & bay lên màn hình thiệp cưới! ❤️');
    });
  }

  // --- NÚT QUÀ: CUỘN ĐẾN PHẦN MỪNG CƯỚI ---
  const openGiftModalBtn = document.getElementById('openGiftModalBtn');

  function scrollToAccountSection(e) {
    if (e) e.preventDefault();
    const target = document.getElementById('accountSection');
    if (!target || target.hidden) return;

    // Mở hết các nhóm tài khoản để khách thấy ngay
    document.querySelectorAll('#giftGroups .stt-acc-toggle').forEach((t) => {
      t.classList.add('active');
      if (t.nextElementSibling) t.nextElementSibling.classList.add('show');
    });

    const mainScroll = document.getElementById('mainScrollContainer');
    if (mainScroll) {
      mainScroll.scrollTo({ top: Math.max(0, target.offsetTop - 20), behavior: 'smooth' });
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    target.classList.remove('account-section-pulse');
    void target.offsetWidth;
    target.classList.add('account-section-pulse');
    setTimeout(() => target.classList.remove('account-section-pulse'), 2000);
  }

  if (openGiftModalBtn) openGiftModalBtn.addEventListener('click', scrollToAccountSection);

  // Accordion nhà trai / nhà gái + nút sao chép số tài khoản
  const giftGroups = document.getElementById('giftGroups');
  if (giftGroups) {
    giftGroups.addEventListener('click', (e) => {
      const toggle = e.target.closest('.stt-acc-toggle');
      if (toggle) {
        toggle.classList.toggle('active');
        if (toggle.nextElementSibling) toggle.nextElementSibling.classList.toggle('show');
        return;
      }
      const copyBtn = e.target.closest('.stt-copy-btn');
      if (copyBtn) {
        const acc = copyBtn.dataset.acc || '';
        const who = copyBtn.dataset.owner ? ` ${copyBtn.dataset.owner.toLowerCase()}` : '';
        Promise.resolve()
          .then(() => navigator.clipboard.writeText(acc))
          .then(() => showToast(`Đã sao chép STK${who}: ${acc}`))
          .catch(() => showToast(`STK${who}: ${acc}`));
      }
    });
  }

  // --- XÁC NHẬN THAM DỰ (RSVP) ---
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
  const maxGuests = () => parseInt(guestCountInput?.max || '4', 10) || 4;

  if (triggerRsvpModalBtn) triggerRsvpModalBtn.addEventListener('click', () => openSheet(rsvpModal));
  if (closeRsvpModalBtn) closeRsvpModalBtn.addEventListener('click', () => closeSheet(rsvpModal));

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

  if (decStepBtn && incStepBtn && guestCountInput) {
    decStepBtn.addEventListener('click', () => {
      const val = parseInt(guestCountInput.value, 10) || 1;
      if (val > 1) guestCountInput.value = val - 1;
    });
    incStepBtn.addEventListener('click', () => {
      const val = parseInt(guestCountInput.value, 10) || 1;
      if (val < maxGuests()) guestCountInput.value = val + 1;
    });
  }

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('guestName').value.trim().slice(0, 80);
      if (!name) {
        showToast('Vui lòng nhập họ và tên của bạn!');
        return;
      }
      const side = rsvpForm.querySelector('input[name="guestSide"]:checked')?.value || 'nha-trai';
      const willAttend = rsvpForm.querySelector('input[name="willAttend"]:checked')?.value === 'yes';
      const guestCount = willAttend ? Math.min(maxGuests(), Math.max(1, parseInt(guestCountInput.value, 10) || 1)) : 0;
      const notes = (document.getElementById('rsvpNotes')?.value || '').trim().slice(0, 500);
      const hp = document.getElementById('rsvpHp')?.value || '';

      setBusy(rsvpForm, true);
      const res = await api.sendRsvp({ code: currentGuest?.code || guestCode || '', name, side, willAttend, guestCount, notes, hp });
      setBusy(rsvpForm, false);
      if (!res || !res.success) {
        showToast((res && res.message) || 'Chưa gửi được xác nhận, vui lòng thử lại.');
        return;
      }

      launchConfetti();
      closeSheet(rsvpModal);
      const dateText = document.getElementById('heroCalloutDate')?.textContent || '';
      if (willAttend) {
        showToast(`Cảm ơn ${name}! Hẹn gặp bạn${dateText ? ` vào ngày ${dateText}` : ''} ❤️`);
      } else {
        showToast(`Cảm ơn ${name} đã phản hồi. Chúc bạn luôn an khang! 🌸`);
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
