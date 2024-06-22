import { Component, OnInit, ViewChild, inject, ChangeDetectorRef} from '@angular/core';
import { RestService } from './../../rest.service';
import {ErrorStateMatcher} from '@angular/material/core';
import { environment } from './../../../environments/environment';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule, MatTable} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';

import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { DialogComponent } from '../dialog/dialog.component';

interface Account {
  id: string;
  service: string;
  email: string;
  username: string;
  password: string;
  phrase?: string;
}

interface User{
  id: string;
  name: string;
  password: string;
  accounts: Account[];
}

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-passwords',
  standalone: true,
  imports: [MatFormFieldModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatInputModule, MatTableModule, DialogComponent, MatIconModule],
  templateUrl: './passwords.component.html',
  styleUrl: './passwords.component.css'
})
export class PasswordsComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  inputFormControl = new FormControl('', [Validators.required, Validators.minLength(4)]);
  matcher = new MyErrorStateMatcher();
  token: string = localStorage.getItem('token') || '';
  name: string = '';
  accounts: Account[] = [];
  fields: { name: string, value: string, matcher: MyErrorStateMatcher, inputFormControl: FormControl}[] = [];
  displayedColumns: string[] = ['service', 'email', 'username', 'password', 'decrypt', 'phrase', 'delete'];

  @ViewChild(MatTable) table: MatTable<Account> | undefined;
  constructor(private RestService: RestService){}

  ngOnInit(): void {
    const url = `${environment.apiUrl}/api/user`
      this.RestService.get(url, { Authorization: `Bearer ${this.token}` }).subscribe({
        next: (value: Object): void => {
          const {name, accounts} = value as User;
          this.name = name;
          this.accounts = accounts;
        },
        error: (e: Error): void => {
          localStorage.clear();
          window.location.href = '/login';
        }
      });
      const fields = ['service', 'email', 'username', 'password', 'phrase'];
      this.fields = fields.map((field) => {
        return { name: field, value: '', matcher: new MyErrorStateMatcher(),
          inputFormControl: new FormControl('', [Validators.required, Validators.minLength(4)])
        };
      });
  }

  confirmDelete(account: Account): void {
    this.showDialog('Confirm Delete', `Are you sure you want to delete the account for ${account.service}?`, 'confirm').afterClosed().subscribe({
      next: (value: boolean): void => {
        if (value) {
          this.deleteAccount(account);
        }
      }
    });
  }

  renderRows(): void {
    if (this.table) {
      this.table.renderRows();
    }
  }

  deleteAccount(account: Account): void {
    const url = `${environment.apiUrl}/api/account/${account.id}`;

    this.RestService.delete(url, { Authorization: `Bearer ${this.token}` }).subscribe({
      next: (value: Object): void => {
        this.showDialog('Account deleted', `The account for ${account.service} has been deleted.`);
        this.accounts = this.accounts.filter((a) => a.id !== account.id);
        this.renderRows()
      },
      error: (e): void => {
        this.showDialog('Error', e.error.error);
      }
    });
  }

  decryptElement(account: Account): void {
    const url = `${environment.apiUrl}/api/account/${account.id}/decrypt`;
    const body = {phrase: account.phrase};

    this.RestService.post(url, body, { Authorization: `Bearer ${this.token}` }).subscribe({
      next: (value: Object): void => {
        const password = (value as Account).password;
        this.showDialog('Password Decrypted', `The password for ${account.service}: ${password}`);
      },
      error: (e): void => {
        this.showDialog('Error', e.error.error);
      }
    });
  }

  showDialog(title: string, message: string, action: string = 'info'): MatDialogRef<DialogComponent, any> {
    return this.dialog.open(DialogComponent, {data: {title, message, action}});
  }

  restoreFields(): void {
    this.fields.forEach((field) => {
      field.inputFormControl.reset();
    });
  }

  addAccount(): void {
    const errors = this.fields.filter((field) => field.inputFormControl.invalid);
    if (errors.length) return;

    const body: { [key: string]: any } = {};
    this.fields.forEach((field) => {
      body[field.name] = field.value;
    });

    const url = `${environment.apiUrl}/api/account`;

    this.RestService.post(url, body, { Authorization: `Bearer ${this.token}` }).subscribe({
      next: (value: Object): void => {
        this.accounts.push(value as Account);
        this.renderRows()
        this.restoreFields()
      },
      error: (e: any): void => {
        this.showDialog('Error', e.error.error);
      }
    });
  }

  logout(): void {
    localStorage.clear();
    window.location.href = '/login';
  }
}
