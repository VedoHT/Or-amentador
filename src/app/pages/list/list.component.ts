import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { OrcamentosService } from '../../services/orcamentos.service';
import { OrcamentoListaItem } from '../../models/orcamento.model';

@Component({
  standalone: true,
  selector: 'app-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  items: OrcamentoListaItem[] = [];
  loading = true;

  constructor(
      private orcamentos: OrcamentosService
  ) {}

  ngOnInit(): void {
    this.orcamentos.listMine().subscribe({
      next: (res) => { this.items = res || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  trackBySlug = (_: number, it: OrcamentoListaItem) => it.slug;
}
