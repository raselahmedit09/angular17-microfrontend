import { Component } from '@angular/core';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  constructor() {
    console.log("home component initialized");

  }

}
