import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent implements AfterViewInit {
  protected readonly title = signal('SnikerHunter');

  public ngAfterViewInit(): void {
    // Navbar toggle
    const overlay = document.querySelector('[data-overlay]') as HTMLElement | null;
    const navOpenBtn = document.querySelector('[data-nav-open-btn]') as HTMLElement | null;
    const navbar = document.querySelector('[data-navbar]') as HTMLElement | null;
    const navCloseBtn = document.querySelector('[data-nav-close-btn]') as HTMLElement | null;

    const toggleNav = () => {
      if (!navbar || !overlay) return;
      navbar.classList.toggle('active');
      overlay.classList.toggle('active');
    };

    [overlay, navOpenBtn, navCloseBtn].forEach((el) => {
      el?.addEventListener('click', toggleNav);
    });

    // Header & go-top on scroll
    const header = document.querySelector('[data-header]') as HTMLElement | null;
    const goTopBtn = document.querySelector('[data-go-top]') as HTMLElement | null;

    const onScroll = () => {
      const active = window.scrollY >= 80;
      if (header) header.classList.toggle('active', active);
      if (goTopBtn) goTopBtn.classList.toggle('active', active);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Search bar validation
    const searchForm = document.querySelector('.nav-action-form') as HTMLFormElement | null;
    const searchInput = document.querySelector('.nav-action-input') as HTMLInputElement | null;
    if (searchForm && searchInput) {
      searchForm.addEventListener('submit', (event) => {
        if (!searchInput.value) {
          event.preventDefault();
          alert('Please enter a search query.');
        }
      });
    }

    // Login validation (if present on page)
    const loginForm = document.getElementById('loginForm') as HTMLFormElement | null;
    if (loginForm) {
      loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = (document.getElementById('email') as HTMLInputElement | null)?.value ?? '';
        const password = (document.getElementById('password') as HTMLInputElement | null)?.value ?? '';
        if (!email.includes('@')) {
          alert('Por favor, insira um email válido.');
          return;
        }
        if (password.length < 6) {
          alert('A senha deve ter pelo menos 6 caracteres.');
          return;
        }
        alert('Login bem-sucedido!');
      });
    }

    // Simple carousel (if present)
    const images = Array.from(document.querySelectorAll('.carousel-image')) as HTMLElement[];
    if (images.length > 0) {
      let currentIndex = 0;
      const showNextImage = () => {
        images[currentIndex]?.classList.remove('active');
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex]?.classList.add('active');
      };
      setInterval(showNextImage, 10000);
    }
  }
}
