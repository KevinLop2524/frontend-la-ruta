import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Peticion } from '../../servicios/peticion';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  nombre: string = ""
  apellido: string = ""
  correo: string = ""
  contrasena: string = ""
  contrasena2: string = ""
  apodo: string = ""

  constructor(private peticion: Peticion, private router:Router) {
  }

  registrar() {
    if (this.contrasena != this.contrasena2 ) {
      
    } else {
      let post = {
      host: this.peticion.urlReal,
      path: "/api/auth/register",
      payload: {
        nombre: this.nombre,
        apellido: this.apellido,
        correo: this.correo,
        contrasena: this.contrasena,
        apodo: this.apodo
      }
    }
    this.peticion.post(post.host+post.path,post.payload).then((res:any)=>{
      console.log(res)
      console.log(post.payload)
      if(res.success==true && res.message=="Usuario registado"){
        this.router.navigate(["/"])
      }
    }).catch((err: any)=>{
      console.log(err)
      console.log(post.payload)
    })
    }
    
  }
}
