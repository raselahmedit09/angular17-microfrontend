import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DateFormatPipe } from "../../../lib1/src/lib/pipes/date-format.pipe";
import { BreadcrumbComponent } from 'lib1';
import { loadRemoteModule } from '@angular-architects/module-federation';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [RouterOutlet, RouterLink, CommonModule, BreadcrumbComponent, DateFormatPipe]
})
export class AppComponent implements OnInit {
  title = 'shell';
  navbarComponent: any;

  public date = new Date();

  // async ngOnInit() {

  //   const remoteComponent = await loadRemoteModule({
  //     type: 'module',
  //     remoteEntry: 'http://localhost:4201/remoteEntry.js',
  //     exposedModule: './navbarComponent'
  //   });

  //   this.navbarComponent = remoteComponent.NavbarComponent;

  //   this.onLoadNavbar('mfe1');
  // }


  ngOnInit() {
    this.onLoadNavbar('mfe1');
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
}
