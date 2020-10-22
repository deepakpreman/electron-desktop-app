import { Component, OnInit } from '@angular/core';
import { RestService } from  '../services/rest.service';
import { first } from 'rxjs/operators';
import { Router } from  '@angular/router';
import { FormBuilder, FormGroup, Validators } from  '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
// import { User } from '../../assets/model/user.schema';
// import { AppService } from '../app.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  public loginForm: FormGroup;
  public isSubmitted : Boolean = false;
  public isDisabled : Boolean  =  false;
  // userList: User[];

  // private appservice: AppService,
  constructor(private spinner: NgxSpinnerService,private toastr: ToastrService,private formBuilder: FormBuilder,private restService: RestService,public router: Router,) { }
 
  get formControls() { return this.loginForm.controls; }

  ngOnInit() {
    let remember_me = localStorage.getItem('remember_me');   
      if(remember_me != null && remember_me == 'true'){
        this.loginForm  =  this.formBuilder.group({
          user_name:  [localStorage.getItem('user_name'), [Validators.required, Validators.email]],
          password: [localStorage.getItem('password'), Validators.required],
          remember_me : true
        });
      } else{
        this.loginForm  =  this.formBuilder.group({
          user_name:  ['', [Validators.required, Validators.email]],
          password: ['', Validators.required],
          remember_me : false
        });
      }
  }
  login(){  
    this.isSubmitted = true;
    this.isDisabled = true;
    if(this.loginForm.invalid){
      this.isDisabled = false;
      return;
    }
    this.spinner.show();
    let user = {
      email : this.loginForm.value.user_name.toLowerCase(),
      password : this.loginForm.value.password,
    };
    this.restService.login(user).pipe(first())
    .subscribe(
      response => {
        this.spinner.hide();
        this.toastr.success('Logged in successfully');  
        this.router.navigateByUrl('/home');
      },
      error => {
          this.spinner.hide();  
          this.toastr.error(error.error.error);
          this.isSubmitted = false;
          this.isDisabled = false; 
      });
 } 

}
