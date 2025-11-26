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
  //lista de sneakers carregados do back
  sneakers: Sneaker[] = [];
  newSneaker: any = {
    name: '',
    price: null,
    brand: '',
    imageUrl: '',
    description: '',
    gender: '',
    sizes: [] as number[]
  };
  editMode = false;
  loading = false;
  error = '';
  message: string | null = null;
  private sub?: Subscription;

  constructor(private sneakerService: SneakerService) {}

  //inicializa o carregamento dos produtos
  ngOnInit(): void {
    this.loading = true;
    this.sub = this.sneakerService.sneakers$.subscribe({
      next: list => { console.debug('[AdminComponent] sneakers$', list); this.sneakers = list; this.loading = false; },
      error: err => { console.error('[AdminComponent] sneakers$ error', err); this.sneakers = []; this.loading = false; this.error = 'Erro ao carregar produtos'; }
    });
    this.sneakerService.loadAll();
  }

  //cancela a inscrição para evitar vazamentos de memória
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onSubmit(): void {
    this.error = '';
    if (!this.newSneaker.name || !this.newSneaker.brand || !this.newSneaker.price) {
      this.error = 'Nome, marca e preço são obrigatórios';
      return;
    }

    if(this.newSneaker.gender === '') {
      this.newSneaker.gender = 'unissex';
    }
    
    if (this.editMode) {
       // atualização de produto existente
      if (!this.newSneaker.id || this.newSneaker.id === 0) {
        this.error = 'ID inválido para atualização';
        console.error('[AdminComponent] update attempted with id 0', this.newSneaker);
        return;
      }
      const id = String(this.newSneaker.id);
      this.sneakerService.updateSneaker(id, this.newSneaker).subscribe({
        next: (updated: any) => { this.resetForm(); },
        error: (err: any) => { this.error = 'Erro ao atualizar'; console.error(err); }
      });
    } else {
      // criação de novo produto
      const toCreate = { ...this.newSneaker };
      // force id como string 
      if (toCreate.id != null) toCreate.id = String(toCreate.id);
      this.sneakerService.createSneaker(toCreate as any).subscribe({
        next: (created: any) => { console.debug('[Admin] created', created); this.sneakerService.loadAll();
          this.resetForm();
         },
        error: (err: any) => { this.error = 'Erro ao criar'; console.error(err); }
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
    // garantir string para o serviço que usa id encoded como string
    const sid = String(id);
    this.sneakerService.deleteSneaker(sid).subscribe({
      next: () => {
        this.message = 'Excluído com sucesso';
        this.sneakerService.loadAll();
      },
      error: (err: any) => {
        this.error = 'Erro ao excluir';
        console.error('[AdminComponent] delete error', err);
      }
    });
  }
    addSize(value: string): void {
    this.error = '';
    if (!value || !value.toString().trim()) {
      this.error = 'Informe um tamanho';
      return;
    }
    // aceita vírgula como separador decimal
    const size = parseFloat(value.replace(',', '.'));
    if (isNaN(size)) {
      this.error = 'Tamanho inválido';
      return;
    }
    // valida intervalo permitido
    if (size < 34 || size > 46) {
      this.error = 'Tamanhos inválidos. Aceitamos apenas tamanhos entre 34 e 46.';
      return;
    }
    // aceita apenas tamanhos inteiros
    if (!Number.isInteger(size)) {
      this.error = 'Aceitamos apenas tamanhos inteiros (ex: 38, 39)';
      return;
    }
    if (!this.newSneaker.sizes) this.newSneaker.sizes = [];
    if (!this.newSneaker.sizes.includes(size)) {
      this.newSneaker.sizes.push(size);
      this.newSneaker.sizes.sort((a: number, b: number) => a - b);
    } else {
      this.error = 'Tamanho já adicionado';
    }
  }

  removeSize(index: number): void {
    if (!this.newSneaker.sizes) return;
    this.newSneaker.sizes.splice(index, 1);
  }

  resetForm(): void {
    this.newSneaker = { name: '', price: 0, brand: '', description: '', imageUrl: '', gender: '', sizes: [] as number[] };
    this.editMode = false;
    this.error = '';
  }
}