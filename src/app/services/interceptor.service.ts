import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders,HttpErrorResponse } from '@angular/common/http';
import { catchError,map, timeout ,} from 'rxjs/operators';
import { Router } from  '@angular/router';
import { Observable, throwError } from 'rxjs';
import {  retry } from 'rxjs/operators';

var obj : any;
@Injectable({
  providedIn: 'root'
})
export class InterceptorService {

  public headers = new HttpHeaders({'Content-Type': 'application/json'});
  public httpOptions = { headers: this.headers };


  constructor(private router: Router,private http: HttpClient) { 
    obj = this;
  }

  public initHeaders(){
    this.headers = new HttpHeaders({'Content-Type': 'application/json' });
    this.httpOptions = { headers: this.headers }; 
  }
  public retrieveData(url) {
    this.initHeaders();
    // return this.http.get<any>(url, this.httpOptions)
    //   .pipe(timeout(this.timeoutsec),map(response => {     
    //     return response;
    // }));
    return this.http.get<any>(url,this.httpOptions)
    .pipe(
      catchError(this.handleError)
    );
    
  }

  public createData(url,params) { 
    this.initHeaders();
    // return this.http.post<any>(url, JSON.stringify(params),this.httpOptions)
    // .pipe(timeout(this.timeoutsec),map(response => {     
    //   return response;
    // }))
    return this.http.post<any>(url, JSON.stringify(params),this.httpOptions)
    .pipe(
      catchError(this.handleError)
    )
  }
  public updateData(url,params) { 
    this.initHeaders();
    // return this.http.put<any>(url, JSON.stringify(params),this.httpOptions)
    // .pipe(timeout(this.timeoutsec),map(response => {     
    //   return response;
    // }))
    return this.http.put<any>(url, JSON.stringify(params),this.httpOptions)
    .pipe(
      catchError(this.handleError)
    )
  }
  public deleteData(url) { 
    this.initHeaders();
    // return this.http.put<any>(url, this.httpOptions)
    // .pipe(timeout(this.timeoutsec),map(response => {     
    //   return response;
    // }))
    return this.http.delete<any>(url,this.httpOptions)
    .pipe(
      catchError(this.handleError)
    )
  }
  public handleError(error: HttpErrorResponse) {

    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      // console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      // console.error(
      //   `Backend returned code ${error.status}, ` +
      //   `body was: ${error.error}`);
        // obj.logoutIfExpired(error.error) 
    }
    // return an observable with a user-facing error message
    return throwError(error);
  };
  


}
