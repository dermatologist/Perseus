import { Component, AfterViewInit, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ITable } from 'src/app/models/table';
import { BridgeService } from 'src/app/services/bridge.service';

import { BridgeButtonData } from '../bridge-button/model/bridge-button-data';
import { BridgeButtonService } from '../bridge-button/service/bridge-button.service';
import { SampleDataPopupComponent } from '../popups/sample-data-popup/sample-data-popup.component';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { PanelTableComponent } from './panel-table/panel-table.component';

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss']
})
export class PanelComponent implements AfterViewInit {
  @Input() table: ITable;
  @Input() tabIndex: number;
  @Input() tables: ITable[];
  @Input() oppositeTableId: any;

  @Output() open = new EventEmitter();
  @Output() close = new EventEmitter();
  @Output() initialized = new EventEmitter();
  @Output() openTransform = new EventEmitter();

  @ViewChild('panel') panel: PanelTableComponent;

  get title() {
    return this.table.name;
  }

  get area() {
    return this.table.area;
  }

  initializing: boolean;

  constructor(
    public dialog: MatDialog,
    private bridgeService: BridgeService,
    private bridgeButtonService: BridgeButtonService
  ) {
    this.initializing = true;
  }

  ngAfterViewInit() {
    this.initialized.emit();
    this.initializing = false;
  }

  onOpen() {
    if (!this.initializing) {
      this.open.emit();
    }
  }

  onClose() {
    if (!this.initializing) {
      this.close.emit();
    }
  }

  openSampleDataDialog(e) {
    e.preventDefault();
    e.stopPropagation();

    this.dialog.open(SampleDataPopupComponent, {
      width: '1021px',
      height: '696px',
      data: this.table
    });
  }

  onOpenTransfromDialog(event: any) {
    const {row, element} = event;

    const connections = this.bridgeService.findCorrespondingConnections(
      this.table,
      row
    );
    if (connections.length > 0) {
      const payload: BridgeButtonData = {
        connector: connections[0].connector,
        arrowCache: this.bridgeService.arrowsCache
      };

      this.bridgeButtonService.init(payload, element);
      this.bridgeButtonService.openRulesDialog();
    }
  }

  onCheckboxChange(event: MatCheckboxChange) {
    for (const row of this.table.rows) {
      const connections = this.bridgeService.findCorrespondingConnections(this.table, row);
      for (const connection of connections) {
        const action = event.checked ? this.linkFields : this.unLinkFields;
        this.similarFieldsAction(connection, action.bind(this));
      }
    }
  }

  similarFieldsAction(connection, action) {
    this.tables.forEach(table => {
      if (table.name === this.table.name) {
        return;
      }

      table.rows.forEach(field => {
        if (field.name !== connection[this.area].name) {
          return;
        }

        if (this.area === 'source') {
          action(field, connection.target, connection.type);
        } else {
          action(connection.source, field, connection.type);
        }
      });
    });
  }

  linkFields(sourceField, targetField, type) {
    this.bridgeService.drawArrow(sourceField, targetField, type);
  }

  unLinkFields(sourceField, targetField) {
    const connectorId = this.bridgeService.getConnectorId(sourceField, targetField);
    this.bridgeService.deleteArrow(connectorId);
  }
}
