// src/app/admin/admin.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SneakerService } from '../services/sneaker.service';
import { Sneaker } from '../models/sneaker';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit, OnDestroy {
  sneakers: Sneaker[] = [];
  newSneaker: Sneaker = { id: 0, name: '', price: 0, brand: '', description: '', imageUrl: '' };
  editMode = false;
  loading = false;
  error = '';
  private sub?: Subscription;

  constructor(private sneakerService: SneakerService) {}

  ngOnInit(): void {
    this.loading = true;
    this.sub = this.sneakerService.sneakers$.subscribe({
      next: list => { console.debug('[AdminComponent] sneakers$', list); this.sneakers = list; this.loading = false; },
      error: err => { console.error('[AdminComponent] sneakers$ error', err); this.sneakers = []; this.loading = false; this.error = 'Erro ao carregar produtos'; }
    });
    // garante que dados estejam carregados
    this.sneakerService.loadAll();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onSubmit(): void {
    this.error = '';
    if (!this.newSneaker.name || !this.newSneaker.brand) {
      this.error = 'Nome e marca são obrigatórios';
      return;
    }

    if (this.editMode) {
      if (!this.newSneaker.id || this.newSneaker.id === 0) {
        this.error = 'ID inválido para atualização';
        console.error('[AdminComponent] update attempted with id 0', this.newSneaker);
        return;
      }
      this.sneakerService.updateSneaker(this.newSneaker.id, this.newSneaker).subscribe({
        next: () => { this.resetForm(); },
        error: err => { this.error = 'Erro ao atualizar'; console.error('[AdminComponent] update error', err); }
      });
    } else {
      const toCreate = { ...this.newSneaker };
      delete (toCreate as any).id;
      this.sneakerService.createSneaker(toCreate as Sneaker).subscribe({
        next: created => { console.debug('[AdminComponent] created', created); this.resetForm(); },
        error: err => { this.error = 'Erro ao criar'; console.error('[AdminComponent] create error', err); }
      });
    }
  }

  editSneaker(s: Sneaker): void {
    this.newSneaker = { ...s };
    this.editMode = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteSneaker(id: number): void {
    if (!id || id === 0) {
      console.error('[AdminComponent] delete attempted with invalid id', id);
      this.error = 'ID inválido para exclusão';
      return;
    }
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    this.sneakerService.deleteSneaker(id).subscribe({
      next: () => {},
      error: err => { this.error = 'Erro ao excluir'; console.error('[AdminComponent] delete error', err); }
    });
  }

  resetForm(): void {
    this.newSneaker = { id: 0, name: '', price: 0, brand: '', description: '', imageUrl: '' };
    this.editMode = false;
    this.error = '';
  }
}