import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';
import { OperationsOverviewComponent } from './features/operations/operations-overview.component';
import { AuthorizationPlaygroundComponent } from './features/authorization/authorization-playground.component';

const routes: Routes = [
  { path: 'operations', component: OperationsOverviewComponent, title: 'Platform Operations' },
  { path: 'authorization', component: AuthorizationPlaygroundComponent, title: 'Authorization Lab' },
  { path: '', pathMatch: 'full', redirectTo: 'operations' },
  { path: '**', redirectTo: 'operations' },
];

@NgModule({ imports: [RouterModule.forRoot(routes, { bindToComponentInputs: true })], exports: [RouterModule] })
export class AppRoutingModule {}
