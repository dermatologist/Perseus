import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ViewChildren,
  QueryList
} from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { StateService } from 'src/app/services/state.service';
import {
  CdkDragDrop,
  moveItemInArray,
  copyArrayItem,
  CdkDrag,
  CdkDragMove
} from '@angular/cdk/drag-drop';
import { MatDialog, MatSnackBar } from '@angular/material';
import { MappingPopupComponent } from '../popaps/mapping-popup/mapping-popup.component';
import { ITable } from 'src/app/models/table';
import { BridgeService } from 'src/app/services/bridge.service';
import { Subscription, merge } from 'rxjs';
import { startWith, map, switchMap, tap } from 'rxjs/operators';
import { Command } from 'src/app/infrastructure/command';
import {
  VocabulariesService,
  IVocabulary
} from 'src/app/services/vocabularies.service';
import { ConceptService } from './services/concept.service';
import { environment } from 'src/environments/environment';
import { Criteria } from '../comfy-search-by-name/comfy-search-by-name.component';
import { IRow } from 'src/app/models/row';
import { uniq, uniqBy } from 'src/app/infrastructure/utility';

@Component({
  selector: 'app-comfy',
  templateUrl: './comfy.component.html',
  styleUrls: ['./comfy.component.scss']
})
export class ComfyComponent implements OnInit, AfterViewInit, OnDestroy {
  get state() {
    return this.stateService.state;
  }

  get sourceTables(): ITable[] {
    return this.state.source.tables;
  }

  get targetTableNames(): string[] {
    return this.targettablenames;
    // return Object.keys(this.target).filter(
    //   tableName => ['CONCEPT', 'COMMON'].indexOf(tableName.toUpperCase()) < 0 // HIDE SPECIAL TARGET TABLES
    // );
  }

  private targettablenames: string[] = [];

  get highlitedTables(): string[] {
    return this.highlitedtables;
  }

  busy = true;
  private highlitedtables: string[] = [];

  source: string[] = [];

  target = {};
  sourceConnectedTo = [];
  sourceRows: IRow[] = [];

  private snakbarOptions = {
    duration: 3000
  };

  speed = 5;
  subs = new Subscription();
  private animationFrame: number | undefined;

  vocabularies: IVocabulary[] = [];

  constructor(
    private dataService: DataService,
    private vocabulariesService: VocabulariesService,
    private stateService: StateService,
    private mappingDialog: MatDialog,
    private bridgeService: BridgeService,
    private snakbar: MatSnackBar,
    private conceptService: ConceptService
  ) {}

  @ViewChild('scrollEl')
  scrollEl: ElementRef<HTMLElement>;

  @ViewChildren(CdkDrag)
  dragEls: QueryList<CdkDrag>;

  ngAfterViewInit() {
    const onMove$ = this.dragEls.changes.pipe(
      startWith(this.dragEls),
      map((d: QueryList<CdkDrag>) => d.toArray()),
      map(dragels => dragels.map(drag => drag.moved)),
      switchMap(obs => merge(...obs)),
      tap(this.triggerScroll)
    );

    this.subs.add(onMove$.subscribe());

    const onDown$ = this.dragEls.changes.pipe(
      startWith(this.dragEls),
      map((d: QueryList<CdkDrag>) => d.toArray()),
      map(dragels => dragels.map(drag => drag.ended)),
      switchMap(obs => merge(...obs)),
      tap(this.cancelScroll)
    );

    this.subs.add(onDown$.subscribe());
  }

  @bound
  public triggerScroll($event: CdkDragMove) {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    this.animationFrame = requestAnimationFrame(() => this.scroll($event));
  }

  @bound
  private cancelScroll() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
  }

  private scroll($event: CdkDragMove) {
    const { y } = $event.pointerPosition;
    const baseEl = this.scrollEl.nativeElement;
    const box = baseEl.getBoundingClientRect();
    const scrollTop = baseEl.scrollTop;
    const top = box.top + -y;
    if (top > 0 && scrollTop !== 0) {
      const newScroll = scrollTop - this.speed * Math.exp(top / 50);
      baseEl.scrollTop = newScroll;
      this.animationFrame = requestAnimationFrame(() => this.scroll($event));
      return;
    }

    const bottom = y - box.bottom;
    if (bottom > 0 && scrollTop < box.bottom) {
      const newScroll = scrollTop + this.speed * Math.exp(bottom / 50);
      baseEl.scrollTop = newScroll;
      this.animationFrame = requestAnimationFrame(() => this.scroll($event));
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  ngOnInit() {
    /*Experiment for vocabulary*/
    this.vocabulariesService.setVocabularyConnectionString().subscribe(
      ok => {
        this.vocabulariesService.getVocabularies().subscribe(vocabularies => {
          this.vocabularies = [...vocabularies];
        });
      },
      error => console.error(error)
    );
    /*Experiment for vocabulary*/

    this.dataService.initialize().subscribe(_ => {
      this.initialize();
      this.busy = false;
    });

    this.bridgeService.applyConfiguration$.subscribe(configuration => {
      this.target = configuration.tables;
    });

    this.bridgeService.resetAllMappings$.subscribe(_ => {
      this.initialize();

      this.snakbar.open(
        `Reset all mappings success`,
        ' DISMISS ',
        this.snakbarOptions
      );
    });
  }

  initialize() {
    this.source = [];
    this.target = {};

    const prefix = 'target';

    this.source = uniq(this.state.source.tables.map(table => table.name));

    this.state.target.tables.map(table => {
      this.target[table.name] = {};
      this.target[table.name].name = `${prefix}-${table.name}`;
      this.target[table.name].first = table.name;
      this.target[table.name].data = [table.name];
    });

    this.targettablenames = uniq(Object.keys(this.target).filter(
      tableName => ['CONCEPT', 'COMMON'].indexOf(tableName.toUpperCase()) < 0 // HIDE SPECIAL TARGET TABLES
    ));

    this.sourceConnectedTo = this.state.target.tables.map(
      table => `${prefix}-${table.name}`
    );

    this.stateService.Target = this.target;

    this.sourceRows = uniqBy(this.state.source.tables
      .map(table => table.rows)
      .reduce((p, k) => p.concat.apply(p, k), []), 'name');
  }

  // tslint:disable-next-line:member-ordering
  drop = new Command({
    execute: (event: CdkDragDrop<string[]>) => {
      if (event.previousContainer === event.container) {
        moveItemInArray(
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
      } else {
        copyArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );

        const targetname = event.container.id.split('-')[1];

        this.setFirstElementAlwaysOnTop(targetname);
      }
    },
    canExecute: (event: CdkDragDrop<string[]>) => {
      return (
        event.container.data.findIndex(
          tableName =>
            event.previousContainer.data[event.previousIndex] === tableName
        ) === -1
      );
    }
  });

  setFirstElementAlwaysOnTop(targetname: string): void {
    if (!targetname) {
      return;
    }

    const { data, first } = this.target[targetname];
    const index = data.findIndex(value => value === first);
    const temp = data[0];
    data[0] = first;
    data[index] = temp;
  }

  openMapping(targetTableName: string): void {
    const targettable = this.state.target.tables.filter(
      table => table.name === targetTableName
    );
    const { data } = this.target[targetTableName];

    const sourcetable = this.state.source.tables.filter(table => {
      const sourceTablesNames = data.slice(1, data.length);
      const index = sourceTablesNames.findIndex(name => name === table.name);
      return index > -1;
    });

    const dialog = this.mappingDialog.open(MappingPopupComponent, {
      width: '90vw',
      height: '90vh',
      data: {
        source: sourcetable,
        target: targettable,
        allTarget: this.state.target.tables
      }
    });

    dialog.afterClosed().subscribe(save => {});
  }

  findTables(selectedSourceColumns: string[]): void {
    const indexes = {};

    this.state.source.tables.forEach(table => {
      indexes[table.name] = selectedSourceColumns.map(columnname =>
        table.rows.findIndex(r => r.name === columnname)
      );
    });

    this.highlitedtables = Object.keys(indexes).filter(tableName => {
      return (
        indexes[tableName].length > 0 &&
        !(indexes[tableName].findIndex(idx => idx === -1) > -1)
      );
    });

    this.source = Object.assign([], this.source);
  }

  removeTableMapping(
    event: any,
    sourceTableName: string,
    targetTableName: string
  ) {
    event.stopPropagation();

    const table = this.target[targetTableName];
    const { data } = table;

    const index = data.findIndex(tablename => tablename === sourceTableName);

    if (index > -1) {
      data.splice(index, 1);
    }

    if (this.conceptService.isConceptTable(targetTableName)) {
      environment.conceptTables.forEach(conceptTable => {
        this.bridgeService.deleteArrowsForMapping(
          conceptTable,
          sourceTableName
        );
      });
    } else {
      this.bridgeService.deleteArrowsForMapping(
        targetTableName,
        sourceTableName
      );
    }
  }

  filterByName(area: string, byName: Criteria): void {
    const areas = ['source-column', 'target', 'source'];
    const idx = areas.indexOf(area);

    const sortByName = (a, b?) => {
      if (a.toUpperCase().indexOf(byName.criteria.toUpperCase()) > -1) {
        return -1;
      }
      return 1;
    };

    if (idx > -1) {
      if (area === 'source') {
        this.source = this.source.sort(sortByName);
      } else if (area === 'target') {
        this.targettablenames = this.targetTableNames.sort(sortByName);
      } else if (area === 'source-column') {
        this.sourceRows = Object.assign(
          [],
          this.sourceRows.sort(row => sortByName(row.name))
        );
      }
    }
  }
}

export function bound(target: Object, propKey: string | symbol) {
  const originalMethod = (target as any)[propKey] as Function;

  // Ensure the above type-assertion is valid at runtime.
  if (typeof originalMethod !== 'function') {
    throw new TypeError('@bound can only be used on methods.');
  }

  if (typeof target === 'function') {
    // Static method, bind to class (if target is of type "function", the method decorator was used on a static method).
    return {
      value() {
        return originalMethod.apply(target, arguments);
      }
    };
  } else if (typeof target === 'object') {
    // Instance method, bind to instance on first invocation (as that is the only way to access an instance from a decorator).
    return {
      get() {
        // Create bound override on object instance. This will hide the original method on the prototype, and instead yield a bound version from the
        // instance itself. The original method will no longer be accessible. Inside a getter, 'this' will refer to the instance.
        const instance = this;

        Object.defineProperty(instance, propKey.toString(), {
          value() {
            // This is effectively a lightweight bind() that skips many (here unnecessary) checks found in native implementations.
            return originalMethod.apply(instance, arguments);
          }
        });

        // The first invocation (per instance) will return the bound method from here. Subsequent calls will never reach this point, due to the way
        // JavaScript runtimes look up properties on objects; the bound method, defined on the instance, will effectively hide it.
        return instance[propKey];
      }
    } as PropertyDescriptor;
  }
}
