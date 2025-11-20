import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  confirmPassword = '';
  error = '';
  registerMode = false;

  constructor(private authService: AuthService, private router: Router) {}

  // aceita evento para garantir preventDefault e evitar submissão nativa (query params)
  onSubmit(event?: Event): void {
    if (event) event.preventDefault();

    this.error = '';
    if (!this.email || !this.password) {
      this.error = 'Preencha email e senha';
      return;
    }

    if (this.registerMode) {
      const ok = this.authService.register(this.email, this.password);
      if (!ok) {
        this.error = 'Usuário já existe';
        return;
      }
      // já logado após registro
      this.navigateAfterLogin();
      return;
    }

    const user = this.authService.login(this.email, this.password);
    if (!user) {
      this.error = 'Credenciais inválidas';
      return;
    }
    this.navigateAfterLogin();
  }

  toggleRegister(): void {
    this.registerMode = !this.registerMode;
    this.error = '';
  }

  logout(): void {
    this.authService.logout();
    // limpar campos
    this.email = '';
    this.password = '';
    this.error = '';
    // manter na tela de login
    this.registerMode = false;
  }

  navigateAfterLogin(): void {
    const current = this.authService.currentUser;
    if (current?.role === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/']);
    }
  }

  voltar(): void {
    this.router.navigate(['/']);
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get currentUserEmail(): string | null {
    return this.authService.currentUser?.email ?? null;
  }
}

