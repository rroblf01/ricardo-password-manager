import { Component, inject } from '@angular/core';
import { PasswordsComponent } from '../../components/passwords/passwords.component';
import { environment } from './../../../environments/environment';
import {MatButtonModule} from '@angular/material/button';
import { RestService } from './../../rest.service';
import { DialogComponent } from '../../components/dialog/dialog.component';
import {
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PasswordsComponent, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent{
  readonly dialog = inject(MatDialog);
  token: string = localStorage.getItem('token') || '';
  constructor(private RestService: RestService) {
    if (!this.token) {
      window.location.href = '/login';
    }
  }

  confirmDelete(): void {
    this.showDialog('Confirm Delete', `Are you sure you want to delete this user?`, 'confirm').afterClosed().subscribe({
      next: (value: boolean): void => {
        if (value) {
          this.deleteUser();
        }
      }
    });
  }
  deleteUser(): void {
    const url = `${environment.apiUrl}/api/user`
      this.RestService.delete(url, { Authorization: `Bearer ${this.token}` }).subscribe({
        next: (value: any): void => {
          localStorage.clear();
          window.location.href = '/login';
        },
        error: (e: any): void => {
          this.showDialog('Error', e.error.message);
        }})
  }

  logout(): void {
    localStorage.clear();
    window.location.href = '/login';
  }

  showDialog(title: string, message: string, action: string = 'info'): MatDialogRef<DialogComponent, any> {
    return this.dialog.open(DialogComponent, {data: {title, message, action}});
  }
}
