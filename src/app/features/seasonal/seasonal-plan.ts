import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { SeasonalPlanService } from '../../core/services/seasonal-plan.service';
import { SeasonalTask, SeasonalTaskStatus, Season, SEASON_LABELS } from '../../core/models/seasonal-plan.model';

interface MergedTask {
  task: SeasonalTask;
  status: SeasonalTaskStatus | null;
}

@Component({
  selector: 'app-seasonal-plan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDividerModule,
  ],
  template: `
    <div class="content-container">
      <div class="page-header">
        <h1 class="page-title">Seasonal Plan – {{ currentYear }}</h1>
        <div class="header-actions">
          <span class="progress-text">{{ completedCount() }}/{{ allTasks().length }} completed</span>
          <button mat-stroked-button (click)="resetPlan()">
            <mat-icon>restart_alt</mat-icon> Reset Plan
          </button>
        </div>
      </div>

      @for (season of seasons; track season) {
        <mat-card class="season-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>{{ seasonIcon(season) }}</mat-icon>
            <mat-card-title>{{ seasonLabel(season) }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @for (mt of tasksBySeason(season); track mt.task.id) {
              <div class="task-item" [class.completed]="isCompleted(mt)">
                <mat-checkbox
                  [checked]="isCompleted(mt)"
                  (change)="toggleTask(mt.task)"
                  [aria-label]="mt.task.name"
                >
                  <div class="task-content">
                    <strong>{{ mt.task.name }}</strong>
                    @if (mt.task.description) {
                      <span class="task-desc">{{ mt.task.description }}</span>
                    }
                    <div class="task-meta">
                      @if (mt.task.gddTriggerMin || mt.task.gddTriggerMax) {
                        <mat-chip class="small-chip">
                          GDD: {{ mt.task.gddTriggerMin ?? '—' }}–{{ mt.task.gddTriggerMax ?? '—' }}
                        </mat-chip>
                      }
                      @if (mt.task.calendarWindowStart) {
                        <mat-chip class="small-chip">{{ mt.task.calendarWindowStart }} – {{ mt.task.calendarWindowEnd }}</mat-chip>
                      }
                    </div>
                  </div>
                </mat-checkbox>
              </div>
              <mat-divider></mat-divider>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: `
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .progress-text {
      font-size: 14px;
      opacity: 0.7;
    }
    .season-card {
      margin-bottom: 16px;
    }
    .task-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 8px 0;
    }
    .task-item.completed {
      opacity: 0.6;
    }
    .task-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .task-desc {
      font-size: 13px;
      opacity: 0.8;
    }
    .task-meta {
      display: flex;
      gap: 4px;
      margin-top: 4px;
    }
    .small-chip {
      font-size: 11px;
    }
  `,
})
export class SeasonalPlanComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly seasonalPlanService = inject(SeasonalPlanService);

  protected readonly currentYear = new Date().getFullYear();
  protected readonly seasons: Season[] = [
    'early-spring', 'spring', 'early-summer', 'summer', 'fall', 'late-fall', 'winter',
  ];

  protected readonly allTasks = signal<SeasonalTask[]>(this.seasonalPlanService.defaultTasks);
  protected readonly statuses = signal<SeasonalTaskStatus[]>([]);

  protected readonly completedCount = computed(() => this.statuses().filter((s) => !!s.completedAt).length);

  private get uid(): string {
    return this.authService.user()?.uid ?? '';
  }

  ngOnInit(): void {
    if (!this.uid) return;
    this.seasonalPlanService.getStatuses(this.uid, this.currentYear).subscribe((s) => {
      this.statuses.set(s);
    });
  }

  protected tasksBySeason(season: Season): MergedTask[] {
    return this.allTasks()
      .filter((t) => t.season === season)
      .map((task) => ({
        task,
        status: this.statuses().find((s) => s.taskId === task.id) ?? null,
      }));
  }

  protected isCompleted(mt: MergedTask): boolean {
    return !!mt.status?.completedAt;
  }

  protected seasonLabel(season: Season): string {
    return SEASON_LABELS[season] ?? season;
  }

  protected seasonIcon(season: string): string {
    const icons: Record<string, string> = {
      'early-spring': 'local_florist',
      'spring': 'local_florist',
      'early-summer': 'wb_sunny',
      'summer': 'beach_access',
      'fall': 'eco',
      'late-fall': 'eco',
      'winter': 'ac_unit',
    };
    return icons[season] ?? 'calendar_today';
  }

  protected async toggleTask(task: SeasonalTask): Promise<void> {
    const current = this.statuses();
    const existing = current.find((s) => s.taskId === task.id);

    let updated: SeasonalTaskStatus[];
    if (existing?.completedAt) {
      // Unmark
      updated = current.filter((s) => s.taskId !== task.id);
    } else {
      // Mark complete
      const newStatus: SeasonalTaskStatus = {
        taskId: task.id,
        year: this.currentYear,
        completedAt: new Date().toISOString(),
      };
      updated = [...current.filter((s) => s.taskId !== task.id), newStatus];
    }

    this.statuses.set(updated);
    await this.seasonalPlanService.saveStatuses(this.uid, this.currentYear, updated);
  }

  protected async resetPlan(): Promise<void> {
    this.statuses.set([]);
    await this.seasonalPlanService.saveStatuses(this.uid, this.currentYear, []);
  }
}
