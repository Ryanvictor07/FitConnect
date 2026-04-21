(function () {
  var saved = localStorage.getItem('fc_theme') || 'dark';
  if (saved === 'light') document.documentElement.classList.add('light');

  document.addEventListener('DOMContentLoaded', function () {

    var btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.title = 'Toggle light / dark mode';
    btn.innerHTML = saved === 'light' ? '🌙' : '☀️';
    btn.style.cssText = [
      'background: none',
      'border: 1px solid var(--border2)',
      'border-radius: 7px',
      'padding: 6px 10px',
      'font-size: 15px',
      'cursor: pointer',
      'opacity: 0.6',
      'line-height: 1',
      'transition: opacity 0.2s, border-color 0.2s',
      'flex-shrink: 0',
      'margin-left: 12px',
    ].join(';');

    btn.onmouseover = function () { btn.style.opacity = '1'; };
    btn.onmouseout  = function () { btn.style.opacity = '0.6'; };

    btn.addEventListener('click', function () {
      var isLight = document.documentElement.classList.toggle('light');
      localStorage.setItem('fc_theme', isLight ? 'light' : 'dark');
      btn.innerHTML = isLight ? '🌙' : '☀️';
    });

    var navLinks = document.querySelector('.nav-links');

    var innerNavbar = document.querySelector('.inner-navbar');

    var topbar = document.querySelector('.topbar');

    var adminLoginCard = document.querySelector('.card-accent');

    if (navLinks) {
      navLinks.appendChild(btn);

    } else if (innerNavbar) {
      innerNavbar.appendChild(btn);

    } else if (topbar) {
      var liveBadge = topbar.querySelector('.live-badge');
      btn.style.marginLeft = '16px';
      if (liveBadge) {
        topbar.insertBefore(btn, liveBadge.nextSibling);
      } else {
        topbar.appendChild(btn);
      }

    } else if (adminLoginCard) {
      btn.style.cssText += ';position:fixed;top:16px;right:20px;z-index:999;';
      document.body.appendChild(btn);
    }

  });
})();
