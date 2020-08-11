import { Component, OnInit, ViewChild, Inject, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DataService } from 'src/app/services/data.service';
import { MatSelect } from '@angular/material/select';
import { UploadService } from 'src/app/services/upload.service';

@Component({
  selector: 'app-open-save-dialog',
  templateUrl: './open-save-dialog.component.html',
  styleUrls: [ './open-save-dialog.component.scss' ]
})
export class OpenSaveDialogComponent implements OnInit {

  @ViewChild('item', { static: true }) versionElement: MatSelect;
  items = [];
  resultValue;

  constructor(
    public dialogRef: MatDialogRef<OpenSaveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data.type === 'select') {
      this.resultValue = this.data.items[ 0 ];
    }
  }

  ngOnInit() {
    if (this.data.type === 'select') {
      this.versionElement.focus();
    }
  }


}