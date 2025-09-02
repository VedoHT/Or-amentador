import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-global-loading',
    standalone: true,
    imports: [NgIf],
    template: `
    <div class="loading-backdrop" *ngIf="show">
      <div class="dots">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>
    </div>
  `,
    styles: [`
    .loading-backdrop{
      position: fixed; inset: 0; z-index: 9999;
      display:flex; align-items:center; justify-content:center;
      background: rgba(0,0,0,.35); backdrop-filter: blur(1px);
    }
    .dots{ display:flex; gap:10px; }
    .dot{ width:10px; height:10px; border-radius:50%; background:#fff; opacity:.85; animation:bounce 1.2s infinite; }
    .dot:nth-child(2){ animation-delay:.15s; }
    .dot:nth-child(3){ animation-delay:.30s; }
    @keyframes bounce{ 0%,80%,100%{ transform:scale(.8); opacity:.6 } 40%{ transform:scale(1.2); opacity:1 } }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlobalLoadingComponent {
    @Input() show = false;
}
