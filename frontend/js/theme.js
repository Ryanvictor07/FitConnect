// theme.js — FitConnect light/dark mode toggle
// Drop this script tag into any page that uses style.css
// It auto-injects the toggle button into .nav-links or .inner-navbar

(function () {
  // Apply saved theme immediately (before paint) to avoid flash
  const saved = localStorage.getItem('fc_theme') || 'dark';
  if (saved === 'light') document.documentElement.classList.add('light');

  document.addEventListener('DOMContentLoaded', () => {
    // Build the toggle button
    const btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.title = 'Toggle light / dark mode';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.innerHTML = saved === 'light' ? '🌙' : '☀️';
    btn.style.cssText = `
      background: none;
      border: 1px solid var(--border2);
      border-radius: 7px;
      padding: 6px 10px;
      font-size: 15px;
      cursor: pointer;
      transition: border-color 0.2s, opacity 0.2s;
      opacity: 0.6;
      line-height: 1;
    `;
    btn.onmouseover = () => btn.style.opacity = '1';
    btn.onmouseout  = () => btn.style.opacity = '0.6';

    btn.addEventListener('click', () => {
      const isLight = document.documentElement.classList.toggle('light');
      localStorage.setItem('fc_theme', isLight ? 'light' : 'dark');
      btn.innerHTML = isLight ? '🌙' : '☀️';
    });

    // Try to inject into navbar
    const navLinks   = document.querySelector('.nav-links');
    const innerNavbar = document.querySelector('.inner-navbar');

    if (navLinks) {
      navLinks.appendChild(btn);
    } else if (innerNavbar) {
      innerNavbar.appendChild(btn);
    }
  });
})();
