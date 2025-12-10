import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Peticion } from '../../servicios/peticion';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  firstName: string = "";
  lastName: string = "";
  email: string = "";
  username: string = "";
  password: string = "";
  password2: string = "";
  dateOfBirth: string = "";

  constructor(private peticion: Peticion, private router: Router) {
  }

  validarPassword(password: string): boolean {
    const regex = /^(?=(?:.*[a-z]){2,})(?=.*[A-Z])(?=(?:.*\d){2,}).{10,15}$/;
    return password != null && regex.test(password);
  }

  registrar() {
    if (this.password != this.password2) {
      Swal.fire({
                title: "Error",
                text: "Las contraseñas no coinciden",
                icon: "error"
              });  
    } else {
      let post = {
        host: this.peticion.urlReal,
        path: "/api/auth/register",
        payload: {
          firstName: this.firstName,
          lastName: this.lastName,
          email: this.email,
          password: this.password,
          username: this.username,
          dateOfBirth: this.dateOfBirth
        }
      }
      this.peticion.post(post.host + post.path, post.payload).then((res: any) => {
        console.log(res)
        console.log(post.payload)
        if (res.role == "CLIENT") {
          Swal.fire({
                title: "Bienvenido",
                text: "Activa tu cuenta e inicia sesión",
                icon: "success"
              });
          this.router.navigate(["/"])
        }
      }).catch((err: any) => {
        console.log(err)
        console.log(post.payload)
        Swal.fire({
                title: "Error",
                text: err.error.message,
                icon: "error"
              });
      })
    }

  }
}
