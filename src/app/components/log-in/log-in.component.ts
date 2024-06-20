import { Component, signal } from '@angular/core';
import { environment } from './../../../environments/environment';
import {ErrorStateMatcher} from '@angular/material/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import { RestService } from './../../rest.service';

import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';


export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [MatFormFieldModule, MatIconModule, MatInputModule, MatButtonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './log-in.component.html',
  styleUrl: './log-in.component.css'
})
export class LogInComponent {
  hide = signal(true);
  userNameFormControl = new FormControl('', [Validators.required, Validators.minLength(4)]);
  passwordFormControl = new FormControl('', [Validators.required, Validators.minLength(6)]);
  matcher = new MyErrorStateMatcher();

  name: string = '';
  password: string = '';
  errors: string = '';

  constructor(private RestService: RestService) {}
  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide);
    event.stopPropagation();
  }

  hasErrors(){
    return this.userNameFormControl.invalid || this.passwordFormControl.invalid;
  }

  login(action: string){
    if (this.hasErrors()) return;

    const url = `${environment.apiUrl}/${action}`;
    const data = { name: this.name, password: this.password };
    this.RestService.post(url, data).subscribe({
      next: (v: Object) => {
        const token = (v as { token: string }).token;

        localStorage.setItem('token', token);
        window.location.href = '/';
      },
      error: (e) => {
        this.errors = e.error.error;
      }
    })
  }
}
