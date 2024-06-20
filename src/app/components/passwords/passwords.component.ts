import { Component, OnInit, ViewChild} from '@angular/core';
import { RestService } from './../../rest.service';
import {ErrorStateMatcher} from '@angular/material/core';
import { environment } from './../../../environments/environment';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule, MatTable} from '@angular/material/table';

import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

interface Account {
  id: string;
  service: string;
  email: string;
  username: string;
  password: string;
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
  imports: [MatFormFieldModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatInputModule, MatTableModule],
  templateUrl: './passwords.component.html',
  styleUrl: './passwords.component.css'
})
export class PasswordsComponent implements OnInit {
  inputFormControl = new FormControl('', [Validators.required, Validators.minLength(4)]);
  matcher = new MyErrorStateMatcher();
  token: string = localStorage.getItem('token') || '';
  name: string = '';
  accounts: Account[] = [];
  fields: { name: string, value: string, matcher: MyErrorStateMatcher, inputFormControl: FormControl}[] = [];
  displayedColumns: string[] = ['service', 'email', 'username', 'password', 'decrypt'];

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
          console.error(e);
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

  decryptElement(element: Account): void {
    console.log(element)
  }
  restoreFields(): void {
    this.fields.forEach((field) => {
      field.value = '';
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
        this.fields.forEach((field) => field.value = '');
        if (this.table) {
          this.table.renderRows();
        }
        this.restoreFields()
      },
      error: (e: Error): void => {
        console.error(e);
      }
    });
  }
}
