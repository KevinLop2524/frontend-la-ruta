
import { Header } from '../header/header';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Peticion } from '../../servicios/peticion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Footer } from '../footer/footer';
import { Router, RouterModule } from '@angular/router';
import { userZodValidator } from '../../validators/userUpdate'


@Component({
  selector: 'app-editar-perfil',
  imports: [Header, CommonModule, FormsModule, Footer, RouterModule],
  templateUrl: './editar-perfil.component.html',
  styleUrl: './editar-perfil.component.css',
  providers: [userZodValidator]
})
export class EditarPerfilComponent implements OnInit {

  constructor(private peticion: Peticion, private cdr: ChangeDetectorRef, private router: Router, private validar: userZodValidator) { }

  perfilEditar: any = {
    firstName: '',
    secondName: '',
    lastName: '',
    secondLastName: '',
    dateOfBirth: '',
    height: '',
    gender: '',
    weight: ''
  };

  usuario: any = {};
  datosNoPermitidos: (string | null | undefined)[] = ["", null, undefined];

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

  ngOnInit(): void {
    this.buscarUsuario();
  }

  buscarUsuario() {
    let apodo = localStorage.getItem('apodo') || undefined;
    let token = localStorage.getItem('token') || undefined;
    let get = {
      host: this.peticion.urlReal,
      path: "/users/me",
      payload: {
      }
    }
    this.peticion.get(get.host + get.path, token).then((res: any) => {
      this.usuario = res;
      console.log("usuario obj", this.usuario)
      this.perfilEditar = {
        firstName: this.usuario.firstName || '',
        secondName: this.usuario.secondName || '',
        lastName: this.usuario.lastName || '',
        secondLastName: this.usuario.secondLastName || '',
        gender: this.usuario.gender || '',
        dateOfBirth: this.usuario.dateOfBirth ? this.usuario.dateOfBirth.split('T')[0] : '',
        height: this.usuario.height ? String(this.usuario.height) : '',
        weight: this.usuario.weight ? String(this.usuario.weight) : '',
      };
      this.cdr.detectChanges();
    }).catch((err) => {
      console.log(err)
      console.log("Usuario logueado:", this.usuario.apodo);
      console.log("Error al encontrar usuario")
    })
  }

  actualizarPerfil() {
    /*
        if (
          this.datosNoPermitidos.includes(this.perfilEditar.firstName) &&
          this.datosNoPermitidos.includes(this.perfilEditar.lastName) &&
          this.datosNoPermitidos.includes(this.perfilEditar.username)
        ) {
          Swal.fire({
            title: 'Error',
            text: 'Tiene que ingresar al menos un campo obligatorio',
            icon: 'warning'
          });
          return;
        }
    */

    const resultado = this.validar.validar(this.perfilEditar);

    if (!resultado.ok) {
      Swal.fire({
        title: 'Algo salio mal',
        text: resultado.error,
        icon: 'warning',
        confirmButtonText: 'Ok'
      });
      return;
    }




    let act = {
      host: this.peticion.urlReal,
      path: '/users/update/' + this.usuario.id,
      payload: {
        firstName: this.perfilEditar.firstName /*|| this.usuario.firstName*/,
        secondName: this.perfilEditar.secondName/* || this.usuario.secondName*/,
        lastName: this.perfilEditar.lastName/* || this.usuario.lastName*/,
        secondLastName: this.perfilEditar.secondLastName/* || this.usuario.secondLastName*/,
        gender: this.perfilEditar.gender /*|| this.usuario.gender*/,
        dateOfBirth: this.perfilEditar.dateOfBirth /*|| this.usuario.dateOfBirth*/,
        height: Number(this.perfilEditar.height),
        weight: Number(this.perfilEditar.weight)
      }
    };

    let token = localStorage.getItem('token') || undefined;

    this.peticion.patch(act.host + act.path, act.payload).then((res: any) => {
      localStorage.setItem('apodo', this.perfilEditar.username);

      Swal.fire({
        title: 'Actualizado',
        text: 'El usuario fue actualizado',
        icon: 'success',
        confirmButtonText: 'Correcto'
      });
      this.buscarUsuario();
      this.cdr.detectChanges();
    }).catch((err: any) => {
      console.error("Error al actualizar el usuario: ", err);
      Swal.fire({
        title: 'Error',
        text: 'Error al actualizar el usuario' + err.error.message,
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    });
  }
}