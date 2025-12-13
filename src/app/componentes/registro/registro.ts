import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Peticion } from '../../servicios/peticion';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { userZodValidator } from '../../validators/user-zod.validator';


@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
  providers: [userZodValidator]
})
export class Registro {


  step: number = 1;

  
  formStep1 = {
    email: '',
    username: '',
    password: '',
    password2: ''
  };

  formStep2 = {
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    genero: ''
  };


  // Cambiar al paso 2
  nextStep() {
    this.step = 2;
  }

  prevStep() {
    this.step = 1;
  }

  usuario: any={
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  username: '',
  dateOfBirth: '',
  gender: ''
}
  contrasena2: String= "";

   fechaActual(): string {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  fechaMinima(): string {
    const hoy = new Date();
    hoy.setFullYear(hoy.getFullYear() - 90);
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  fechaMaxima(): string {
    const hoy = new Date();
    hoy.setFullYear(hoy.getFullYear() - 18);
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  constructor(private peticion: Peticion, private router: Router, private validar: userZodValidator) {
  }

  validarPassword(password: string): boolean {
    const regex = /^(?=(?:.*[a-z]){2,})(?=.*[A-Z])(?=(?:.*\d){2,}).{10,15}$/;
    return password != null && regex.test(password);
  }

  registrar() {

        const resultado = this.validar.validar(this.usuario);
    
        if (!resultado.ok) {
          Swal.fire({
            title: 'Algo salio mal',
            text: resultado.error,
            icon: 'warning',
            confirmButtonText: 'Ok'
          });
          console.log(resultado)
          return;
        }
    if (this.usuario.password != this.contrasena2) {
      Swal.fire({
            title: 'Algo salio mal',
            text: 'las contraseña no coinciden',
            icon: 'warning',
            confirmButtonText: 'Ok'
          });
          return;
      } else {
      let post = {
        host: this.peticion.urlReal,
        path: "/auth/register",
        payload: {
          firstName: this.usuario.firstName,
          lastName: this.usuario.lastName,
          email: this.usuario.email,
          password: this.usuario.password,
          username: this.usuario.username,
          dateOfBirth: this.usuario.dateOfBirth,
          gender: this.usuario.gender
        }
      }
      this.peticion.post(post.host + post.path, post.payload).then((res: any) => {
        console.log(res)
        console.log(post.payload)
        if (res.success == true && res.message == "Usuario registado") {
          Swal.fire({
          title: 'Exito!',
          text: 'Usuario registrado exitosamente',
          icon: 'success',
          confirmButtonText: 'Ok'
        })
          this.router.navigate(["/"])
        }
      }).catch((err: any) => {

        Swal.fire({
          title: 'Error!',
          text: 'El usuario no se pudo registrar '+ err.error.message,
          icon: 'error',
          confirmButtonText: 'Cerrar'

        })
        console.log(err)
        console.log(post.payload)
      })
    }

  }
}
