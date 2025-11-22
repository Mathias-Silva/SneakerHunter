// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppUser {
  email: string;
  role: 'admin' | 'user';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const raw = localStorage.getItem('currentUser');
    if (raw) {
      try {
        this.currentUserSubject.next(JSON.parse(raw));
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
  }

  private saveToStorage(user: AppUser | null): void {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(user);
  }

  // credenciais admin fixas (exemplo)
  private isAdminCredentials(email: string, password: string): boolean {
    return email === 'admin@sneakerhunter.com' && password === 'admin123';
  }

  // login: retorna AppUser ou null
  login(email: string, password: string): AppUser | null {
    // admin check
    if (this.isAdminCredentials(email, password)) {
      const admin: AppUser = { email, role: 'admin' };
      this.saveToStorage(admin);
      return admin;
    }

    // procurar usuários cadastrados no localStorage (simples demo)
    const usersRaw = localStorage.getItem('users') || '[]';
    const users = JSON.parse(usersRaw) as { email: string; password: string }[];
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      const user: AppUser = { email, role: 'user' };
      this.saveToStorage(user);
      return user;
    }

    return null;
  }

  // registro simples: retorna true se cadastrado com sucesso, false se já existe
  register(email: string, password: string): boolean {
    const usersRaw = localStorage.getItem('users') || '[]';
    const users = JSON.parse(usersRaw) as { email: string; password: string }[];
    if (users.find(u => u.email === email) || this.isAdminCredentials(email, password)) {
      return false;
    }
    users.push({ email, password });
    localStorage.setItem('users', JSON.stringify(users));
    // auto-login após cadastro
    const newUser: AppUser = { email, role: 'user' };
    this.saveToStorage(newUser);
    return true;
  }

  logout(): void {
    this.saveToStorage(null);
  }

  get currentUser(): AppUser | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }
}