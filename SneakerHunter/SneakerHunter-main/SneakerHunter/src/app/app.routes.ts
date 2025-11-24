import { Routes } from '@angular/router';
import { SobreComponent } from './sobre/sobre.component';
// import { ProdutosComponent } from './produtos/produtos.component';
import { LoginComponent } from './login/login.component';
import { ContatoComponent } from './contato/contato.component';

import { AdminComponent } from './admin/admin.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'home', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'sobre', component: SobreComponent },
  // { path: 'produtos', component: ProdutosComponent },
  { path: 'login', component: LoginComponent },
  { path: 'contato', component: ContatoComponent },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard]
  },
  { path: 'cart', loadComponent: () => import('./cart/cart.component').then(m => m.CartComponent) },
  { path: 'favorites', loadComponent: () => import('./favorites/favorites.component').then(m => m.FavoritesComponent) },
  { path: '**', redirectTo: '/home' }
];
