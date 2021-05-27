import { Inject, Injectable } from '@angular/core';
import { DbSettings } from '../../../models/scan-data/db-settings';
import { WhiteRabbitWebsocketService } from '../white-rabbit-websocket.service';
import { ScanDataService } from '../../../services/white-rabbit/scan-data.service';
import { DelimitedTextFileSettings } from '../../../models/scan-data/delimited-text-file-settings';
import { authInjector } from '../../../services/auth/auth-injector';

@Injectable()
export class ScanDataWebsocketService extends WhiteRabbitWebsocketService {

  endPoint = 'scan-data'

  constructor(private scanDataService: ScanDataService, @Inject(authInjector) authService) {
    super(authService)
  }

  send(data: DbSettings | DelimitedTextFileSettings): void {
    const request$ = 'dbType' in data ?
      this.scanDataService.generateScanReportByDb(data, this.sessionId) :
      this.scanDataService.generateScanReportByFiles(data as DelimitedTextFileSettings, this.sessionId)

    request$.subscribe(
      () => this.connection$.next(true),
      error => this.connection$.error(error)
    )
  }
}
