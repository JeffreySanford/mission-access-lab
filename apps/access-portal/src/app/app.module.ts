import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OperationsOverviewComponent } from './features/operations/operations-overview.component';
import { AuthorizationPlaygroundComponent } from './features/authorization/authorization-playground.component';

@NgModule({
  declarations: [AppComponent, OperationsOverviewComponent, AuthorizationPlaygroundComponent],
  imports: [BrowserModule, BrowserAnimationsModule, HttpClientModule, FormsModule, AppRoutingModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
