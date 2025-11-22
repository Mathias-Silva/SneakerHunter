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
      // merge guest/session data if needed (services provide merge methods)
      this.favoritesService.mergeSessionIntoUser?.(userId);
      this.cartService.mergeSessionIntoUser?.(userId);
      // load user data
      this.favoritesService.loadForUser(userId).subscribe();
      this.cartService.loadCartForUser(userId).subscribe();
      // navigate
      if (user.role === 'admin') this.router.navigate(['/admin']);
      else this.router.navigate(['/']);
    }, () => this.erro = 'Erro ao conectar');
  }
  aoEnviar(event?: Event): void {
    if (event) event.preventDefault();
    this.erro = '';

    if (this.modoCadastro) {
      // validações para cadastro
      if (!this.nome.trim()) {
        this.erro = 'Nome é obrigatório';
        return;
      }
      if (!this.email.trim() || !this.validarEmail(this.email)) {
        this.erro = 'Email inválido';
        return;
      }
      if (!this.cpf.trim() || !this.validarCPF(this.cpf)) {
        this.erro = 'CPF inválido (use 11 dígitos válidos)';
        return;
      }
      if (!this.senha) {
        this.erro = 'Senha é obrigatória';
        return;
      }
      if (!this.senhaValida(this.senha)) {
        this.erro = 'A senha deve ter ao menos 6 caracteres';
        return;
      }
      if (!this.confirmacaoSenha) {
        this.erro = 'Confirme a senha';
        return;
      }
      if (this.senha !== this.confirmacaoSenha) {
        this.erro = 'As senhas não coincidem';
        return;
      }

      // tenta cadastrar (authService.register deve retornar boolean ou similar)
      const ok = this.authService.register(this.email, this.senha);
      if (!ok) {
        this.erro = 'Não foi possível cadastrar: e-mail já existe';
        return;
      }

      // sucesso: navegar / manter usuário logado conforme serviço
      this.navegarAposLogin();
      return;
    }

    // validações para login
    if (!this.email.trim() || !this.validarEmail(this.email)) {
      this.erro = 'Email inválido';
      return;
    }
    if (!this.senha) {
      this.erro = 'Senha é obrigatória';
      return;
    }

    this.authService.login(this.email, this.senha).subscribe(user => {
      if (!user) {
        this.erro = 'Credenciais inválidas';
        return;
      }
      // user salvo no AuthService via tap
      const userId = user.id;
      // carregar dados dependentes do usuário
      this.favoritesService.loadForUser(userId).subscribe();
      this.cartService.loadCartForUser(userId).subscribe();

      if (user.role === 'admin') {
        this.router.navigate(['/admin']);
        return;
      }
      this.navegarAposLogin();
    });
  }

  alternarCadastro(): void {
    this.modoCadastro = !this.modoCadastro;
    this.erro = '';
    // limpa campos relevantes ao alternar
    this.confirmacaoSenha = '';
    if (!this.modoCadastro) {
      // volta ao modo login: não precisa manter nome/cpf
      this.nome = '';
      this.cpf = '';
    }
  }

  deslogar(): void {
    this.authService.logout();
    this.email = '';
    this.senha = '';
    this.erro = '';
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

  // validação de CPF (verificação dos dígitos)
  private validarCPF(cpf: string): boolean {
    // validação simples: exatamente 11 dígitos numéricos
    const digits = (cpf || '').replace(/\D/g, '');
    return digits.length === 11;
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
    this.authService.register(this.email, this.senha, this.nome).subscribe({
      next: () => {
        // após cadastro, direciona para tela de login
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

