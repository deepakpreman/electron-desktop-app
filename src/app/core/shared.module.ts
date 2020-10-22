import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common'
import { HttpClientModule } from '@angular/common/http';

@NgModule({
    imports: [
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      HttpClientModule,
    ],
    declarations: [ 
    ],
    providers: [DatePipe],
    exports: [
      FormsModule,
      ReactiveFormsModule,
    ]
    

 })
 export class SharedModule { }
