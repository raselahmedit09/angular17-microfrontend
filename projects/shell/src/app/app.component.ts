import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BreadcrumbComponent } from "../../../lib1/src/lib/components/breadcrumb/breadcrumb.component";
import { CommonModule } from '@angular/common';
import { DateFormatPipe } from "../../../lib1/src/lib/pipes/date-format.pipe";

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [RouterOutlet, RouterLink, CommonModule, BreadcrumbComponent, DateFormatPipe]
})
export class AppComponent {
  title = 'shell';

  public date = new Date();
}
