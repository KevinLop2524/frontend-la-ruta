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
  apodo: string = ""
  contrasena: string = ""
  constructor(private peticion: Peticion, private router: Router) { }

  iniciar() {
    let post = {
      host: this.peticion.urlReal,
      path: "/api/auth/login",
      payload: {
        apodo: this.apodo,
        contrasena: this.contrasena
      }
    }
    this.peticion.post(post.host + post.path, post.payload).then((res: any) => {

      console.log(res)
      if (res.success==false) {
        Swal.fire({
          title: "Error ",
          text: res.message,
          icon: "error"
        });
      } else if (res.roles[0] != null) {
        Swal.fire({
          title: "Bienvenido " + res.apodo,
          text: "",
          icon: "success"
        });
        console.log(res)
        console.log(post.payload)
        localStorage.setItem("token", res.token);
        localStorage.setItem("apodo", res.apodo);
        localStorage.setItem("roles", JSON.stringify(res.roles));
        this.router.navigate(["comunidades"])
      }
    }).catch((err: any) => {
      console.log(err)
      console.log(post.payload)
    })
  }
}
