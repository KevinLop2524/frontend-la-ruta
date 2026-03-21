import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {

  constructor(private router: Router){}

  logOut(){
    localStorage.clear();
    localStorage.removeItem('token');
    localStorage.removeItem('apodo');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    
    this.router.navigate(["login"])
  }
}
