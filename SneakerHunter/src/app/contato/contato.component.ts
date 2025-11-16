import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-contato',
  standalone: true,
  imports: [],
  templateUrl: './contato.component.html',
  styleUrl: './contato.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ContatoComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    const contatoForm = document.getElementById('contatoForm') as HTMLFormElement | null;
    if (contatoForm) {
      contatoForm.addEventListener('submit', (event) => {
        event.preventDefault();
        alert('Mensagem enviada com sucesso! Em breve entraremos em contato.');
        contatoForm.reset();
      });
    }
  }
}

