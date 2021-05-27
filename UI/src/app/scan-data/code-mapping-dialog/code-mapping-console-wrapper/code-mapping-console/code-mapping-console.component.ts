import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ConsoleComponent } from '../../../auxiliary/scan-console-wrapper/console/console.component';
import { CodeMappingWebsocketService } from '../../../../websocket/code-mapping/code-mapping-websocket.service';
import {
  ProgressNotification,
  ProgressNotificationStatus,
  ProgressNotificationStatusCode
} from '../../../../models/scan-data/progress-notification';
import { ImportCodesService } from '../../../../services/import-codes/import-codes.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-code-mapping-console',
  templateUrl: '../../../auxiliary/scan-console-wrapper/console/console.component.html',
  styleUrls: ['../../../auxiliary/scan-console-wrapper/console/console.component.scss'],
  providers: [CodeMappingWebsocketService]
})
export class CodeMappingConsoleComponent extends ConsoleComponent implements OnInit {

  @Output()
  error = new EventEmitter<string>()

  private completedStepsCount = 0
  private allStepsCount: number;

  constructor(codeMappingWebsocketService: CodeMappingWebsocketService,
              private importCodesService: ImportCodesService) {
    super(codeMappingWebsocketService)
  }

  ngOnInit() {
    this.websocketService.connect()
      .pipe(
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(
        () => {},
        error =>
          this.handleProgressMessage({
            message: this.websocketService.handleError(error),
            status: {
              code: ProgressNotificationStatusCode.FAILED
            }
          })
      )

    // New codes or edit existed vocabulary
    this.allStepsCount = this.importCodesService.codes ? this.importCodesService.codes
      .filter(code => code.selected)
      .length + 1 : 3;
    // 1 - First step - index generation, next calculate score for code
    // 3 - Steps for edit existed vocabulary

    this.onConnect();
  }

  protected handleProgressMessage(notification: ProgressNotification): void {
    const status = (notification.status as ProgressNotificationStatus).code
    this.showNotificationMessage(notification)

    switch (status) {
      case ProgressNotificationStatusCode.IN_PROGRESS: {
        this.progressValue = ++this.completedStepsCount / this.allStepsCount * 100;
        break;
      }
      case ProgressNotificationStatusCode.FINISHED: {
        this.progressValue = 100;
        this.websocketService.disconnect();
        this.finish.emit(true)
        break;
      }
      case ProgressNotificationStatusCode.FAILED: {
        this.progressValue = 0;
        this.websocketService.disconnect();
        this.error.emit(notification.message)
        break;
      }
    }
  }

  protected onConnect(): void {
    this.scanningStarted = true;
    this.subscribeOnProgressMessages();
  }
}
