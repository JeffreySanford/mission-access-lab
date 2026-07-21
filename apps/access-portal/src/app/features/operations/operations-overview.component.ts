import { ChangeDetectionStrategy, Component } from '@angular/core';
import { map, shareReplay, type Observable } from 'rxjs';
import { OperationsApiService } from '../../core/operations-api.service';
import type { MetricPoint, OperationsViewModel, ServiceNode } from '../../core/operations.models';

@Component({
  selector: 'mal-operations-overview',
  templateUrl: './operations-overview.component.html',
  styleUrl: './operations-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class OperationsOverviewComponent {
  readonly viewModel$: Observable<OperationsViewModel> = this.operationsApi.watchSnapshot().pipe(
    map((snapshot) => {
      const paths = this.buildTrafficPaths(snapshot.requestSeries);
      const total = Math.max(1, snapshot.allowedChecks + snapshot.deniedChecks);
      return { ...snapshot, ...paths, allowPercent: snapshot.allowedChecks / total * 100, denyPercent: snapshot.deniedChecks / total * 100 };
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private readonly operationsApi: OperationsApiService) {}

  nodeById(nodes: ServiceNode[], id: string): ServiceNode | undefined { return nodes.find((node) => node.id === id); }
  maxLatency(items: Array<{ p95Ms: number }>): number { return Math.max(1, ...items.map((item) => item.p95Ms)); }

  private buildTrafficPaths(points: MetricPoint[]): { trafficPath: string; trafficAreaPath: string } {
    if (points.length === 0) return { trafficPath: '', trafficAreaPath: '' };
    const width = 720, height = 180, max = Math.max(...points.map((point) => point.value), 1);
    const coords = points.map((point, index) => ({ x: index / Math.max(1, points.length - 1) * width, y: height - point.value / max * (height - 18) - 9 }));
    const line = coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
    const area = `${line} L ${width} ${height} L 0 ${height} Z`;
    return { trafficPath: line, trafficAreaPath: area };
  }
}
