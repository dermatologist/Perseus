import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { CdmVersionDialogComponent } from '@popups/cdm-version-dialog/cdm-version-dialog.component';
import { DeleteWarningComponent } from '@popups/delete-warning/delete-warning.component';
import { OnBoardingComponent } from '@popups/on-boarding/on-boarding.component';
import { ResetWarningComponent } from '@popups/reset-warning/reset-warning.component';
import { BridgeService } from './bridge.service';
import { EtlConfigurationService } from './etl-configuration.service';
import { DataService } from './data.service';
import { OverlayConfigOptions } from './overlay/overlay-config-options.interface';
import { OverlayService } from './overlay/overlay.service';
import { StoreService } from './store.service';
import { mainPageRouter } from '@app/app.constants';
import { SaveMappingDialogComponent } from '@popups/save-mapping-dialog/save-mapping-dialog.component'

@Injectable()
export class CommonUtilsService {
  private renderer: Renderer2;
  private readonly loadReport = new BehaviorSubject<any>(false);
  readonly loadSourceReport$ = this.loadReport.asObservable();

  constructor(
    private overlayService: OverlayService,
    private matDialog: MatDialog,
    private dataService: DataService,
    private bridgeService: BridgeService,
    private storeService: StoreService,
    private router: Router,
    private configService: EtlConfigurationService,
    private snackbar: MatSnackBar,
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  findTableByKeyValue(tables, key, value) {
    return tables.find(it => it[ key ] === value);
  }

  openSetCDMDialog() {
    const matDialog = this.matDialog.open(CdmVersionDialogComponent, {
      closeOnNavigation: false,
      disableClose: false,
      panelClass: 'cdm-version-dialog',
    });

    matDialog.afterClosed().pipe(
      mergeMap(res1 => {
        if (res1) {
          return this.dataService.getTargetData(res1);
        }
        return of(false);
      })
    ).subscribe();
  }

  saveMappingDialog() {
    const matDialog = this.matDialog.open(SaveMappingDialogComponent, {
      closeOnNavigation: false,
      disableClose: false,
      panelClass: 'cdm-version-dialog'
    });
    matDialog.afterClosed().subscribe(res => {
      if (res) {
        this.openSnackbarMessage(res);
      }
    });
  }

  openResetWarningDialog(settings: any) {
    const { warning, header, okButton, deleteButton } = settings;
    const matDialog = this.matDialog.open(ResetWarningComponent, {
      data: { warning, header, okButton, deleteButton },
      closeOnNavigation: false,
      disableClose: false,
      panelClass: 'warning-dialog',
    });

    matDialog.afterClosed().subscribe(res => {
      if (res === 'Delete') {
        this.resetMappingsAndReturnToComfy(settings.deleteSourceAndTarget);
      }
    });
  }

  resetMappingsAndReturnToComfy(deleteSourceAndTarget: boolean) {
    this.bridgeService.resetAllMappings();
    if (deleteSourceAndTarget) {
      this.storeService.resetAllData();
      this.router.navigateByUrl(`${mainPageRouter}/comfy`);
    }
  }

  loadReportWithoutWarning() {
    this.loadReport.next(true);
  }

  resetMappingsWithWarning() {
    const settings = {
      warning: 'You want to reset all mappings. This action cannot be undone',
      header: 'Delete mappings',
      okButton: 'Cancel',
      deleteButton: 'Delete',
      deleteSourceAndTarget: true,
    };
    this.openResetWarningDialog(settings);
  }

  resetSourceAndTargetWithWarning() {
    const settings = {
      warning: 'All mappings will be lost. Do you want to save created mappings?',
      header: 'Save mappings',
      okButton: 'Save',
      deleteButton: 'Delete',
      deleteSourceAndTarget: true
    };
    this.openResetWarningDialog(settings);
  }

  loadNewReportWithWarning() {
    const settings = {
      warning: 'You want to load a new report. All changes will be lost. Do you want to save current mappings?',
      header: 'Load new report',
      okButton: 'Save',
      deleteButton: 'Don\'t save',
      deleteSourceAndTarget: false,
      loadReport: true
    };
    this.openResetWarningDialog(settings);
  }

  deleteTableWithWarning() {
    return this.matDialog.open(DeleteWarningComponent, {
      closeOnNavigation: false,
      disableClose: false,
      panelClass: 'warning-dialog',
      data: {
        title: 'View',
        message: 'You want to delete the view'
      }
    });
  }

  openSnackbarMessage(message: string) {
    this.snackbar.open(message, ' DISMISS ');
  }

  openOnBoardingTip(target: EventTarget, key) {
    const dialogOptions: OverlayConfigOptions = {
      hasBackdrop: true,
      backdropClass: 'on-boarding-backdrop',
      panelClass: 'on-boarding-bottom',
      payload: { key },
      positionStrategyFor: key
    };
    const dialogRef = this.overlayService.open(dialogOptions, target, OnBoardingComponent);
    this.renderer.addClass(target, 'on-boarding-anchor');
    dialogRef.afterClosed$.subscribe(() => this.renderer.removeClass(target, 'on-boarding-anchor'));
  }
}
