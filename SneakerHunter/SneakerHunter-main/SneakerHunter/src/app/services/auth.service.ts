import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = 'http://localhost:3000';
  currentUser$ = new BehaviorSubject<any | null>(null);

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any | null> {
    return this.http
      .get<any[]>(`${this.api}/users?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`)
      .pipe(
        map(list => (list && list.length ? list[0] : null)),
        tap(user => {
          if (user) {
            const safe = { ...user };
            delete (safe as any).password;
            this.currentUser$.next(safe);
          }
        })
      );
  }

  // Register: verifica email e CPF antes de criar; retorna erro se duplicado
  register(email: string, password: string, name = '', cpf = ''): Observable<any> {
    const cleanEmail = (email || '').trim();
    const cleanCpf = (cpf || '').trim();

    // verifica email duplicado no back
    return this.http.get<any[]>(`${this.api}/users?email=${encodeURIComponent(cleanEmail)}`).pipe(
      switchMap(emailList => {
        if (emailList && emailList.length) {
          return throwError(() => new Error(`O email ${cleanEmail} já está cadastrado`));
        }
        // verifica cpf duplicado no back
        if (cleanCpf) {
          return this.http.get<any[]>(`${this.api}/users?cpf=${encodeURIComponent(cleanCpf)}`).pipe(
            switchMap(cpfList => {
              if (cpfList && cpfList.length) {
                return throwError(() => new Error(`O CPF já está cadastrado`));
              }
              const payload = { email: cleanEmail, password, name, cpf: cleanCpf, role: 'user' };
              return this.http.post<any>(`${this.api}/users`, payload);
            })
          );
        }
        // sem CPF informado
        const payload = { email: cleanEmail, password, name, role: 'user' };
        return this.http.post<any>(`${this.api}/users`, payload);
      })
    );
  }

  logout(): void {
    this.currentUser$.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUser$.value;
  }

  isAdmin(): boolean {
    const u = this.currentUser$.value;
    return !!(u && u.role === 'admin');
  }
  // Getter síncrono do usuário atual
  get currentUser(): any | null {
    return this.currentUser$.value;
  }

  getCurrentUser(): any | null {
    return this.currentUser;
  }
}