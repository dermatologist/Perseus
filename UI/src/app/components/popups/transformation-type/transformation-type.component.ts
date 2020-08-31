import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-transformation-type',
  templateUrl: './transformation-type.component.html',
  styleUrls: [ './transformation-type.component.scss', '../set-connection-type-popup/set-connection-type-popup.component.scss' ]
})
export class TransformationTypeComponent implements OnInit {

  @Input() typeName: string;
  @Input() data;
  @Output() selectedType = new EventEmitter<string>();
  @Output() toggleCheckbox = new EventEmitter<string>();
  configured = false;
  isTypeChecked = false;

  constructor() { }

  ngOnInit(): void {
    this.configured = this.data && !!this.data[ 'name' ];
    this.isTypeChecked = this.data && !!this.data[ 'applied' ];
  }

  typeChecked() {
    this.isTypeChecked = !this.isTypeChecked;
    this.toggleCheckbox.emit();
  }

  typeSelected() {
    this.selectedType.emit(this.typeName);
  }
}
