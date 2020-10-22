import { Injectable } from '@angular/core';
import { environment } from './../../environments/environment';
import { InterceptorService } from "./interceptor.service";
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RestService {
  public api_url = environment.url;
  public headers = new HttpHeaders({'Content-Type': 'application/json'});
  public httpOptions = { headers: this.headers };


  constructor(private http: HttpClient , private interceptor: InterceptorService) {}


  public login(params) {
    let url = this.api_url+'/api/login';
    return this.interceptor.createData(url,params); 
  }

  public isLoggedIn(){
    return sessionStorage.getItem('CURRENT_USER') !== null;
  }

  public logout(){
    sessionStorage.clear();
    return true;
  }

  public getUsers(){    
    let url = this.api_url+'/api/users?page=2';
    return this.interceptor.retrieveData(url); 
  }

}