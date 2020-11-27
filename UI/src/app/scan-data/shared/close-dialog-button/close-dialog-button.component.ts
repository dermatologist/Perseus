import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-close-dialog-button',
  template: `
    <div class="close-dialog-button" style="cursor: pointer" (click)="click.emit()">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.66659 1.2735L8.72659 0.333496L4.99992 4.06016L1.27325 0.333496L0.333252 1.2735L4.05992 5.00016L0.333252 8.72683L1.27325 9.66683L4.99992 5.94016L8.72659 9.66683L9.66659 8.72683L5.93992 5.00016L9.66659 1.2735Z" fill="#2C2C2C"/>
      </svg>
    </div>
  `,
})
export class CloseDialogButtonComponent implements OnInit {

  @Output()
  click = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
  }

}
