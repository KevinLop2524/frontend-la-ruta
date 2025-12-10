import { Component } from '@angular/core';
import { Peticion } from '../../servicios/peticion';
import { FormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inicio-sesion',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './inicio-sesion.html',
  styleUrl: './inicio-sesion.css'
})
export class InicioSesion {
  identifier: string = ""
  contrasena: string = ""
  constructor(private peticion: Peticion, private router: Router) { }

  iniciar() {
    let post = {
      host: this.peticion.urlReal,
      path: "/api/auth/login",
      payload: {  
        identifier: this.identifier,
        password: this.contrasena
      }
    }
    this.peticion.post(post.host + post.path, post.payload).then((res: any) => {

      console.log(res)
      if (res.username.toLowerCase() == this.identifier.toLowerCase() || res.email.toLowerCase() == this.identifier.toLowerCase()) {
        Swal.fire({
          title: "Bienvenido " + res.username,
          text: "",
          icon: "success"
        });
        console.log(res)
        console.log(post.payload)
        localStorage.setItem("token", res.token);
        localStorage.setItem("apodo", res.username);
        localStorage.setItem("role", res.role);
        this.router.navigate(["comunidades"])
      }
    }).catch((err: any) => {
      console.log(post.payload)
      if (err.status==400) {
        Swal.fire({
          title: "Error",
          text: err.error.message,
          icon: "error"
        });
      }
    })
  }
}
