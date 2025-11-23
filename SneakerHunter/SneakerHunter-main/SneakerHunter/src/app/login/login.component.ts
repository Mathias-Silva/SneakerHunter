import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { FavoritesService } from '../services/favorite.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  nome = '';
  email = '';
  cpf = '';
  senha = '';
  confirmacaoSenha = '';
  erro = '';
  modoCadastro = false;
  isAdmin = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cartService: CartService,
    private favoritesService: FavoritesService
  ) {}

    fazerLogin() {
    this.authService.login(this.email, this.senha).subscribe(user => {
      if (!user) { this.erro = 'Credenciais inválidas'; return; }
      const userId = user.id;
      this.favoritesService.mergeSessionIntoUser?.(userId);
      this.cartService.mergeSessionIntoUser?.(userId);
      this.favoritesService.loadForUser(userId).subscribe();
      this.cartService.loadCartForUser(userId).subscribe();
      if (user.role === 'admin') this.router.navigate(['/admin']);
      else this.router.navigate(['/']);
    }, () => this.erro = 'Erro ao conectar');
  }
 aoEnviar(event?: Event): void {
  if (event) event.preventDefault();
  this.erro = '';

  if (this.modoCadastro) {
    if (!this.nome.trim()) { this.erro = 'Nome é obrigatório'; return; }
    if (!this.email.trim() || !this.validarEmail(this.email)) { this.erro = 'Email inválido'; return; }
    if (!this.cpf.trim() || !this.validarCPF(this.cpf)) { this.erro = 'CPF inválido'; return; }
    if (!this.senhaValida(this.senha)) { this.erro = 'A senha deve ter ao menos 6 caracteres'; return; }
    if (this.senha !== this.confirmacaoSenha) { this.erro = 'As senhas não coincidem'; return; }

    this.authService.register(this.email, this.senha, this.nome, this.cpf).subscribe({
      next: () => {
        this.modoCadastro = false;
        this.erro = 'Cadastro realizado com sucesso! Faça login.';
        this.senha = '';
        this.email = '';
      },
      error: (err) => {
        if (err.message.includes(this.email) || err.message.includes(this.cpf)) {
      this.erro = err.message;
    } else {
      this.erro = 'Erro ao cadastrar usuário';
    }

      }
    });
    return;
  }

  if (!this.email.trim() || !this.validarEmail(this.email)) { this.erro = 'Email inválido'; return; }
  if (!this.senha) { this.erro = 'Senha é obrigatória'; return; }

  this.authService.login(this.email, this.senha).subscribe({
    next: user => {
      if (!user) { this.erro = 'Credenciais inválidas'; return; }
      const userId = user.id;
      this.favoritesService.loadForUser(userId).subscribe();
      this.cartService.loadCartForUser(userId).subscribe();

      if (user.role === 'admin') this.router.navigate(['/admin']);
      else this.router.navigate(['/']);
    },
    error: () => this.erro = 'Erro ao conectar'
  });
}
  alternarCadastro(): void {
    this.modoCadastro = !this.modoCadastro;
    this.erro = '';
    this.confirmacaoSenha = '';
    if (!this.modoCadastro) {
      this.nome = '';
      this.cpf = '';
    }
  }

  deslogar(): void {
    this.authService.logout();
    this.email = '';
    this.senha = '';
    this.erro = '';
    this.cpf = '';
    this.nome = '';
    this.confirmacaoSenha = '';
    this.modoCadastro = false;
  }

  navegarAposLogin(): void {
    const atual = this.authService.currentUser;
    if (atual?.role === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/']);
    }
  }

  voltar(): void {
    this.router.navigate(['/']);
  }

  get estaLogado(): boolean {
    return this.authService.isLoggedIn();
  }

  get emailUsuarioAtual(): string | null {
    return this.authService.currentUser?.email ?? null;
  }

  get isAdminUser(): boolean {
    return this.estaLogado && this.authService.currentUser?.role === 'admin';
  }

  // validações

  private validarEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  private senhaValida(s: string): boolean {
    return s.length >= 6;
  }

 
private validarCPF(cpf: string): boolean {
  const digits = (cpf || '').replace(/\D/g, '');

  // precisa ter 11 dígitos
  if (digits.length !== 11) return false;

  // rejeita sequências com todos os dígitos iguais (ex.: 00000000000, 11111111111)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }
  let first = (sum * 10) % 11;
  if (first === 10) first = 0;
  if (first !== parseInt(digits[9], 10)) return false;

  // valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i);
  }
  let second = (sum * 10) % 11;
  if (second === 10) second = 0;
  if (second !== parseInt(digits[10], 10)) return false;

  return true;
}

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // remove tudo que não for dígito e limita a 11 dígitos
    const digits = (input.value || '').replace(/\D/g, '').slice(0, 11);

    // formata progressivamente: ###.###.###.##
    let formatted = '';
    if (digits.length <= 3) {
      formatted = digits;
    } else if (digits.length <= 6) {
      formatted = `${digits.slice(0,3)}.${digits.slice(3)}`;
    } else if (digits.length <= 9) {
      formatted = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
    } else {
      formatted = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9,11)}`;
    }

    // atualiza o modelo com formato
    this.cpf = formatted;
  }

    cadastrar() {
    if (!this.email || !this.senha) { this.erro = 'Preencha email e senha'; return; }
    this.authService.register(this.email, this.senha, this.nome, this.cpf).subscribe({
      next: () => {
        
        this.router.navigate(['/login']);
      },
      error: () => {
        this.erro = 'Erro ao cadastrar usuário';
      }
    });
  }

  goToAdmin() {
    this.router.navigate(['/admin']);
  }
}

