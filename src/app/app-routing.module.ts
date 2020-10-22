import { NgModule } from '@angular/core';
import { Routes, Router, RouterModule, PreloadAllModules} from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: LoginComponent},
  { path: 'login', pathMatch: 'full', component: LoginComponent},
  { path: 'home', pathMatch: 'full', component: HomeComponent},
];

//console.log(routes);

@NgModule({
  imports: [RouterModule.forRoot(routes,{ useHash: true, preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { 

constructor(private router: Router) { 
    //console.log('test1');
   
  }
}
