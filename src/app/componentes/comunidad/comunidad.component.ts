import { Header } from '../header/header';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Peticion } from '../../servicios/peticion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Footer } from '../footer/footer';
import { RouterModule } from '@angular/router';
import { z } from "zod";//Se importamos zod
import { comunidadZodValidator } from '../../validators/comunidad-zod.validator';

@Component({
  selector: 'app-comunidad',
  imports: [Header, CommonModule, FormsModule, Footer, RouterModule],
  templateUrl: './comunidad.component.html',
  styleUrl: './comunidad.component.css',
  providers: [comunidadZodValidator]
})
export class ComunidadComponent implements OnInit {
  rol: string[] = [];
  apodo: String | null = null
  comunidadseleccionada: any = null
  datosNoPermitidos: (string | null | undefined)[] = ["", null, undefined];
  comunidades: any[] = []
  usuario: any = {}

  nuevaComunidad: any = {
    category: '',
    name: '',
    descripcion: '',
    creatorId: null,
    active: true
  };

  comunidadEditar: any = {
    category: '',
    name: '',
    description: ''
  };

  abrirModal(comunidad: any) {
    this.comunidadseleccionada = comunidad;
    this.comunidadEditar = { ...comunidad };
  }

  constructor(private peticion: Peticion, private cdr: ChangeDetectorRef, private validar: comunidadZodValidator) { }

  ngOnInit(): void {
    this.rol = JSON.parse(localStorage.getItem('roles') || '[]')
    this.cargarComunidades();
    this.buscarUsuario();
    console.log("rol:", this.rol)
  }


  cargarComunidades() {
    let get = {
      host: this.peticion.urlReal,
      path: "/api/communities/active",
      payload: {
      }
    }
    this.peticion.get(get.host + get.path).then((res: any) => {
      console.log(res)
      this.comunidades = res
      this.cdr.detectChanges()
    }).catch((err: any) => {
                   console.log("Error al encontrar comunidades Error: ", err);
                 })
  }

  buscarUsuario() {

    let apodo = localStorage.getItem('apodo') || undefined;
    let token = localStorage.getItem('token') || undefined;
    let get = {
      host: this.peticion.urlReal,
      path: "/api/users/get/" + 4,
      payload: {
      }
    }
    this.peticion.get(get.host + get.path, token).then((res: any) => {
      this.usuario = res;
      this.nuevaComunidad.creatorId = this.usuario.id
      this.cdr.detectChanges()
      console.log("Usuario logueado:", this.usuario.usuario);

    }) .catch((err: any) => {
      console.log("Error al encontrar usuario", apodo, "Error: ", err);
    })
  }

  crearComunidad() {

    let token = localStorage.getItem('token') || undefined;


    const resultado= this.validar.validar(this.nuevaComunidad);

    if (!resultado.ok){
      Swal.fire({
        title: 'Algo salio mal',
        text: resultado.error,
        icon: 'warning',
        confirmButtonText: 'Ok'
      });
      return;
    }

//Es una maravilla esta dependencia

    let post = {
      host: this.peticion.urlReal,
      path: "/api/communities/create",
      payload: {
        category: this.nuevaComunidad.category,
        name: this.nuevaComunidad.name,
        description: this.nuevaComunidad.description,
        creatorId: this.usuario.id,
        active: true,
      }
    }

    this.peticion.post(post.host + post.path, post.payload).then((res: any) => {
      console.log("Comunidad creada:", res);
      if (res.active) {
        Swal.fire({
          title: '¡Éxito!',
          text: res.mensaje,
          icon: 'success',
          confirmButtonText: 'Ok'
        });

        this.cargarComunidades();
        this.cdr.detectChanges()

        this.nuevaComunidad = { category: '', name: '', description: '', creatorId: this.usuario.id || null, active: true }
      }
    })

      .catch((err: any) => {
        console.error("Error al crear la comunidad", err);
        Swal.fire({
          title: 'Error',
          text: 'Error al crear la comunidad: ' + err.error.message,
          icon: 'error',
          confirmButtonText: 'Cerrar'
        });
      });
  }

  eliminarComunidad() {
    let del = {
      host: this.peticion.urlReal,
      path: "/api/communities/delete/" + this.comunidadseleccionada.id
    };

    this.peticion.delete(del.host + del.path, {}).then((res: any) => {
      Swal.fire({
        title: 'Eliminada',
        text: 'La comunidad fue eliminada',
        icon: 'success',
        confirmButtonText: 'Correcto'
      })
      this.cargarComunidades();
      this.cdr.detectChanges()

    }).catch((err: any) => {
      console.error("error al eliminar la comunidad", err);
      Swal.fire({
        title: 'Error',
        text: err.error,
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    });
  }

  actualizarComunidad(comunidad: any) {


    const resultado= this.validar.validar(this.comunidadEditar);

    if (!resultado.ok){
      const error= resultado.error;
    Swal.fire({
      title: 'Algo salio mal',
      text: error,
      icon: 'warning',
      confirmButtonText: 'Ok'
    })
    console.log(error)
    return;
    }

    let token = localStorage.getItem('token') || undefined;



    let act = {
      host: this.peticion.urlReal,
      path: '/api/communities/update/' + comunidad.id,
      payload: {
        category: this.comunidadEditar.category,
        name: this.comunidadEditar.name,
        description: this.comunidadEditar.description,
      }
    };
    this.peticion.patch(act.host + act.path, act.payload, token).then((res: any) => {
      console.log("id_creador de la actualización", comunidad)
      Swal.fire({
        title: 'Actualizada',
        text: 'La comunidad fue actualizada',
        icon: 'success',
        confirmButtonText: 'Correcto'
        })
      this.cargarComunidades();
    }).catch((err: any) => {
      console.error("error al actualizar la comunidad", err);
      Swal.fire({
        title: 'Error',
        text: 'Error al actualizar la comunidad: '+ err.error.message,
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    });
  }

}