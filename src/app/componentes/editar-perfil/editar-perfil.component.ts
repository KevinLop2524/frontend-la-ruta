
import { Header } from '../header/header';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Peticion } from '../../servicios/peticion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Footer } from '../footer/footer';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-editar-perfil',
  imports: [Header, CommonModule, FormsModule, Footer, RouterModule],
  templateUrl: './editar-perfil.component.html',
  styleUrl: './editar-perfil.component.css'
})
export class EditarPerfilComponent implements OnInit {

  constructor(private peticion: Peticion, private cdr: ChangeDetectorRef, private router: Router) { }

  perfilEditar: any = {
    nombre: '',
    nombreDos: '',
    apellido: '',
    apellidoDos: '',
    apodo: '',
    localidad: '',
    nacimiento: '',
    altura: '',
    sexo: '',
    id: null
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
      path: "/usuarios/apodo/" + apodo,
      payload: {
      }
    }
    this.peticion.get(get.host + get.path, token).then((res: any) => {
      this.usuario = res;
      console.log("usuario obj", this.usuario)
      this.perfilEditar = {
        nombre: this.usuario.nombre || '',
        nombreDos: this.usuario.nombre_2 || '',
        apellido: this.usuario.apellido || '',
        apellidoDos: this.usuario.apellido_2 || '',
        apodo: this.usuario.apodo || '',
        localidad: this.usuario.localidad || '',
        nacimiento: this.usuario.nacimiento ? this.usuario.nacimiento.split('T')[0] : '',
        altura: this.usuario.altura || '',
        sexo: this.usuario.sexo || '',
        id: this.usuario.id
      };
      this.cdr.detectChanges();
    }).catch((err) => {
      console.log(err)
      console.log("Usuario logueado:", this.usuario.apodo);
      console.log("Error al encontrar usuario")
    })
  }

  actualizarPerfil() {
    // Validación básica
    if (
      this.datosNoPermitidos.includes(this.perfilEditar.nombre) &&
      this.datosNoPermitidos.includes(this.perfilEditar.apellido) &&
      this.datosNoPermitidos.includes(this.perfilEditar.apodo)
    ) {
      Swal.fire({
        title: 'Error',
        text: 'Tiene que ingresar al menos un campo obligatorio',
        icon: 'warning'
      });
      return;
    }

    let act = {
      host: this.peticion.urlReal,
      path: '/actualizar/' + this.usuario.id,
      payload: {
        nombre: this.perfilEditar.nombre || this.usuario.nombre,
        nombre_2: this.perfilEditar.nombreDos || this.usuario.nombre_2,
        apellido: this.perfilEditar.apellido || this.usuario.apellido,
        apellido_2: this.perfilEditar.apellidoDos || this.usuario.apellido_2,
        apodo: this.perfilEditar.apodo || this.usuario.apodo,
        localidad: this.perfilEditar.localidad || this.usuario.localidad,
        sexo: this.perfilEditar.sexo || this.usuario.sexo,
        nacimiento: this.perfilEditar.nacimiento || this.usuario.nacimiento,
        altura: this.perfilEditar.altura ?? this.usuario.altura
      }
    };

    let token = localStorage.getItem('token') || undefined;

    this.peticion.put(act.host + act.path, act.payload, token).then((res: any) => {
      localStorage.setItem('apodo', this.perfilEditar.apodo);
      Swal.fire({
        title: 'Actualizada',
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
        text: 'Error al actualizar el usuario',
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    });
  }
}