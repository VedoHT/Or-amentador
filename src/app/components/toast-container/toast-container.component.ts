import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
  <div class="toast-wrap">
    <div *ngFor="let t of toasts" class="toast" [class.ok]="t.kind==='success'"
         [class.err]="t.kind==='error'" [class.warn]="t.kind==='warning'" [class.inf]="t.kind==='info'">
      <span class="dot"></span>
      <div class="txt">{{t.text}}</div>
      <button class="x" (click)="close(t.id)">×</button>
    </div>
  </div>`,
    styles: [`
  .toast-wrap{position:fixed; right:16px; bottom:16px; display:flex; flex-direction:column; gap:8px; z-index:9999;}
  .toast{min-width:260px; max-width:380px; display:grid; grid-template-columns:auto 1fr auto; gap:8px;
    padding:10px 12px; border-radius:12px; border:1px solid var(--border); background:var(--bg-2); box-shadow:0 12px 30px rgba(0,0,0,.18);}
  .dot{width:8px; height:8px; border-radius:50%; align-self:center; background:var(--accent);}
  .toast.ok .dot{background:#22c55e;} .toast.err .dot{background:#ef4444;} .toast.warn .dot{background:#f59e0b;} .toast.inf .dot{background:#3b82f6;}
  .txt{color:var(--text); font-size:14px;}
  .x{border:none;background:transparent;color:var(--muted);cursor:pointer;font-size:18px;line-height:1}
  `]
})
export class ToastContainerComponent {
    toasts: Toast[] = [];
    constructor(private ts: ToastService) {
        this.ts.stream$.subscribe(t => {
            this.toasts.push(t);
            if (t.timeout) setTimeout(() => this.close(t.id), t.timeout);
        });
    }
    close(id: string){ this.toasts = this.toasts.filter(x => x.id !== id); }
}
