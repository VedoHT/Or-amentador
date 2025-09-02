import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-photo-uploader',
  imports: [CommonModule],
  templateUrl: './photo-uploader.component.html',
  styleUrls: ['./photo-uploader.component.css']
})
export class PhotoUploaderComponent {
  @Input() value: string[] = [];
  @Output() valueChange = new EventEmitter<string[]>();

  // normaliza para data URL (jpeg/png) quando vier só o base64
  asDataUrl(s: string): string {
    if (!s) return '';
    if (s.startsWith('data:')) return s;
    const head = s.slice(0, 12);
    const mime =
        head.startsWith('/9j/') ? 'image/jpeg' :
            head.startsWith('iVBORw0KGgo') ? 'image/png' :
                'image/jpeg';
    return `data:${mime};base64,${s}`;
  }

  onInputChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = input.files;
    if (!files || !files.length) return;

    const max = 5 - (this.value?.length ?? 0);
    const picks = Array.from(files).slice(0, Math.max(0, max));

    let remaining = picks.length;
    picks.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        this.value = [...(this.value || []), dataUrl];
        remaining--;
        if (remaining === 0) this.valueChange.emit(this.value);
      };
      reader.readAsDataURL(f);
    });

    input.value = ''; // reset
  }

  remove(i: number) {
    this.value.splice(i, 1);
    this.value = [...this.value];
    this.valueChange.emit(this.value);
  }

  clear() {
    this.value = [];
    this.valueChange.emit(this.value);
  }
}
