import { AfterViewInit, Component, HostListener, NgZone, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-a-propos',
  templateUrl: './a-propos.component.html',
  styleUrls: ['./a-propos.component.css']
})
export class AProposComponent implements OnInit, AfterViewInit {
  constructor(private zone: NgZone, private title: Title, private meta: Meta) {}

  ngOnInit(): void {
    this.title.setTitle('À propos — Douceur d’Or');
    this.meta.updateTag({ name: 'description', content: 'Histoire, valeurs et équipe de la pâtisserie Douceur d’Or. Artisanat, qualité et créativité au service de vos événements.' });
  }

  @HostListener('document:mousemove', ['$event'])
  onMouse(e: MouseEvent){
    document.documentElement.style.setProperty('--mx', e.clientX + 'px');
    document.documentElement.style.setProperty('--my', e.clientY + 'px');
  }

  ngAfterViewInit(): void {
    const counters = Array.from(document.querySelectorAll<HTMLElement>('.stat-num'));
    const io = new IntersectionObserver(ents => {
      ents.forEach(ent => {
        if (ent.isIntersecting) {
          this.zone.runOutsideAngular(() => this.animate(ent.target as HTMLElement));
          io.unobserve(ent.target);
        }
      });
    }, { threshold: .4 });
    counters.forEach(el => io.observe(el));
  }

  private animate(el: HTMLElement){
    const target = Number(el.dataset['target'] || 0);
    const start = performance.now(), dur = 900;
    const step = (t:number) => {
      const p = Math.min(1, (t-start)/dur);
      const eased = p*(2-p);
      el.textContent = Math.floor(target*eased).toString();
      if (p<1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
