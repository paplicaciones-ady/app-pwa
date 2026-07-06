import { AfterViewInit, Component, ElementRef, inject, input, output, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-adaptive-card',
  standalone: true,
  template: `<div #cardContainer class="adaptive-card-wrapper"></div>`,
  styles: `
    :host { display: block; }
    .adaptive-card-wrapper { margin-top: 8px; }
  `,
})
export class AdaptiveCardComponent implements AfterViewInit {
  readonly cardJson = input.required<any>();
  readonly submitCard = output<any>();

  @ViewChild('cardContainer', { static: true }) private readonly container!: ElementRef<HTMLDivElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  ngAfterViewInit() {
    if (this.isBrowser) {
      setTimeout(() => this.renderCard());
    }
  }

  private async renderCard() {
    const cardData = this.cardJson();
    if (!cardData?.body?.length) return;

    try {
      const mod = await import('adaptivecards');
      const card = new mod.AdaptiveCard();
      card.parse(cardData);
      card.onExecuteAction = (action: any) => {
        if (action.getJsonTypeName?.() === 'Action.Submit') {
          this.submitCard.emit(action.data);
        }
      };
      const rendered = card.render();
      if (rendered) {
        this.container.nativeElement.appendChild(rendered);
        (rendered as HTMLElement).style.border = '1px solid #e0e0e0';
        (rendered as HTMLElement).style.borderRadius = '8px';
        (rendered as HTMLElement).style.padding = '12px';
        (rendered as HTMLElement).style.backgroundColor = '#ffffff';
      }
    } catch (err) {
      console.warn('[AdaptiveCard] render error:', err);
    }
  }
}
