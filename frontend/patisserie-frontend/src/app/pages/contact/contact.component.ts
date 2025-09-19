import { Component, HostListener } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  model = { name:'', email:'', phone:'', subject:'', message:'' };
  sending = false; success = false;

  @HostListener('document:mousemove', ['$event'])
  onMouse(e: MouseEvent){
    document.documentElement.style.setProperty('--mx', e.clientX + 'px');
    document.documentElement.style.setProperty('--my', e.clientY + 'px');
  }

  onSubmit(f: NgForm){
    if (f.invalid) return;
    this.sending = true;
    // TODO: remplace par un vrai appel HTTP
    setTimeout(() => {
      this.sending = false; this.success = true; f.resetForm();
      setTimeout(()=> this.success = false, 3000);
    }, 900);
  }
}
