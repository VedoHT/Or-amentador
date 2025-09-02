import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Quote } from '../../models';

@Component({
  standalone: true,
  selector: 'app-public',
  imports: [CommonModule],
  templateUrl: './public.component.html',
  styleUrls: ['./public.component.css']
})
export class PublicComponent {
  quote: Quote | null = null;
  constructor(private route: ActivatedRoute) {
  }
}
