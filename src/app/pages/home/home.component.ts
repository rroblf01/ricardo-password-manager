import { Component } from '@angular/core';
import { PasswordsComponent } from '../../components/passwords/passwords.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PasswordsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent{

  constructor() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    }
  }
}
