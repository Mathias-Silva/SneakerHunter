import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap , switchMap} from 'rxjs/operators';

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
        tap(user => this.currentUser$.next(user))
      );
  }

register(email: string, password: string, name = '', cpf = '', role = 'user'): Observable<any> {
  const user = { email, password, name, role, cpf };

  return this.http.get<any[]>(`${this.api}/users?email=${encodeURIComponent(email)}&cpf=${encodeURIComponent(cpf)}`)
    .pipe(
      switchMap(() =>
        this.http.get<any[]>(`${this.api}/users?email=${encodeURIComponent(email)}`)
      ),
      switchMap(emailMatches => {
        if (emailMatches.length > 0) {
          throw new Error('Email já cadastrado');
        }
        return this.http.get<any[]>(`${this.api}/users?cpf=${encodeURIComponent(cpf)}`);
      }),
      switchMap(cpfMatches => {
        if (cpfMatches.length > 0) {
          throw new Error('CPF já cadastrado');
        }
        return this.http.post<any>(`${this.api}/users`, user);
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

  get currentUser(): any | null {
    return this.currentUser$.value;
  }

  getCurrentUser(): any | null {
    return this.currentUser;
  }
}