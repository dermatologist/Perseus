import { Component } from '@angular/core';
import { ConsoleComponent } from '../../../auxiliary/scan-console-wrapper/console/console.component';
import { finalize } from 'rxjs/operators';
import {
  ProgressNotification,
  ProgressNotificationStatus,
  ProgressNotificationStatusCode
} from '../../../../models/scan-data/progress-notification';
import { ScanDataWebsocketService } from '../../../../websocket/white-rabbit/scan-data/scan-data-websocket.service';
import { ScanDataService } from '../../../../services/white-rabbit/scan-data.service';
import { parseHttpError } from '../../../../utilites/error';

@Component({
  selector: 'scan-data-console',
  templateUrl: '../../../auxiliary/scan-console-wrapper/console/console.component.html',
  styleUrls: ['../../../auxiliary/scan-console-wrapper/console/console.component.scss'],
  providers: [ScanDataWebsocketService]
})
export class ScanDataConsoleComponent extends ConsoleComponent {

  private scannedItemsCount = 0;

  constructor(private scanDataWebsocketService: ScanDataWebsocketService,
              private whiteRabbitService: ScanDataService) {
    super(scanDataWebsocketService);
  }

  abortAndCancel() {
    if (this.scanDataWebsocketService.sessionId) {
      this.whiteRabbitService.abort(this.scanDataWebsocketService.sessionId)
        .pipe(finalize(() => this.websocketService.disconnect()))
        .subscribe()
    }
  }

  protected handleProgressMessage(message: string): void {
    const notification = JSON.parse(message) as ProgressNotification;
    this.showNotificationMessage(notification);

    switch ((notification.status as ProgressNotificationStatus).code) {
      case ProgressNotificationStatusCode.IN_PROGRESS: {
        this.progressValue = this.scannedItemsCount / this.params.itemsToScanCount * 100;
        this.scannedItemsCount++;
        break;
      }
      case ProgressNotificationStatusCode.FINISHED: {
        this.progressValue = 100
        this.websocketService.disconnect()
        this.whiteRabbitService.result(this.scanDataWebsocketService.sessionId)
          .subscribe(
            result => this.finish.emit(result),
            error => this.showNotificationMessage({
              message: parseHttpError(error),
              status: {
                code: ProgressNotificationStatusCode.ERROR
              }
            })
          )
        break;
      }
      case ProgressNotificationStatusCode.FAILED: {
        this.progressValue = 0;
        this.websocketService.disconnect();
        break;
      }
    }
  }
}
