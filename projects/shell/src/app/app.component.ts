import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DateFormatPipe } from "../../../lib1/src/lib/pipes/date-format.pipe";
import { BreadcrumbComponent } from 'lib1';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { TranslatePipe } from './pipes/translate.pipe';
import { I18nService } from './services/i18n.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [RouterOutlet, RouterLink, CommonModule, BreadcrumbComponent, DateFormatPipe, TranslatePipe]
})
export class AppComponent implements OnInit {
  title = 'shell';
  navbarComponent: any;

  public date = new Date();

  constructor(private i18nService: I18nService) {
  }

  async ngOnInit() {
    this.onLoadNavbar('mfe1');

    const locale = 'en';
    await this.i18nService.loadTranslations(locale);
  }

  public async onLoadNavbar(remoteApp: string) {
    let remoteComponent: any;

    switch (remoteApp) {
      case 'mfe1':
        remoteComponent = await loadRemoteModule({
          type: 'module',
          remoteEntry: 'http://localhost:4201/remoteEntry.js',
          exposedModule: './navbarComponent'
        });

        this.navbarComponent = remoteComponent.NavbarComponent;
        break;

      case 'mfe2':
        remoteComponent = await loadRemoteModule({
          type: 'module',
          remoteEntry: 'http://localhost:4202/remoteEntry.js',
          exposedModule: './navbarComponent'
        });

        this.navbarComponent = remoteComponent.NavbarComponent;
        break;
    }
  };

  public switchLanguage(locale: string): void {
    this.i18nService.loadTranslations(locale);
  }
}
