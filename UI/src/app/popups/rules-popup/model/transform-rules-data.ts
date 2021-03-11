import { IConnector } from 'src/app/models/connector.interface';
import { ArrowCache } from 'src/app/models/arrow-cache';

export interface TransformRulesData {
  connector: IConnector;
  arrowCache: ArrowCache;
}
