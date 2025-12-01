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
    tematica: '',
    nombre: '',
    descripcion: '',
    tipo: '',
    idCreador: null,
    estado: 'activo'
  };

  comunidadEditar: any = {
    tematica: '',
    nombre: '',
    descripcion: '',
    tipo: '',
    idCreador: null,
    estado: 'activo'
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
      path: "/api/comunidades",
      payload: {
      }
    }
    this.peticion.get(get.host + get.path).then((res: any) => {
      this.comunidades = res
      this.cdr.detectChanges()
    }).catch(() => {
      console.log("Error al obtener comunidades")
    })
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
      this.nuevaComunidad.idCreador = this.usuario.id
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
      path: "/comunidad/crear",
      payload: {
        tematica: this.nuevaComunidad.tematica,
        nombre: this.nuevaComunidad.nombre,
        descripcion: this.nuevaComunidad.descripcion,
        tipo: this.nuevaComunidad.tipo,
        idCreador: this.usuario.id,
        estado: 'activo',
        fecha: '2025-09-24'
      }
    }

    this.peticion.post(post.host + post.path, post.payload, token).then((res: any) => {
      console.log("Comunidad creada:", res);
      if (res.estado) {
        Swal.fire({
          title: '¡Éxito!',
          text: res.mensaje,
          icon: 'success',
          confirmButtonText: 'Ok'
        });

        this.cargarComunidades();
        this.cdr.detectChanges()

        this.nuevaComunidad = { tematica: '', nombre: '', descripcion: '', tipo: '', idCreador: this.usuario.id || null, estado: 'activo' }
      }
    })

      .catch((err: any) => {
        console.error("Error al crear la comunidad", err);
        Swal.fire({
          title: 'Error',
          text: err.error?.mensaje || 'Error al crear la comunidad, terrible',
          icon: 'error',
          confirmButtonText: 'Cerrar'
        });
      });
  }

  eliminarComunidad() {
    let del = {
      host: this.peticion.urlReal,
      path: "/comunidad/eliminar/" + this.comunidadseleccionada.id
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
      path: '/comunidad/actualizar/' + comunidad.id,
      payload: {
        tematica: this.datosNoPermitidos.includes(this.comunidadEditar.tematica) ? comunidad.tematica : this.comunidadEditar.tematica,
        nombre: this.datosNoPermitidos.includes(this.comunidadEditar.nombre) ? comunidad.nombre : this.comunidadEditar.nombre,
        descripcion: this.datosNoPermitidos.includes(this.comunidadEditar.descripcion) ? comunidad.descripcion : this.comunidadEditar.descripcion,
        tipo: this.datosNoPermitidos.includes(this.comunidadEditar.tipo) ? comunidad.tipo : this.comunidadEditar.tipo,
        idCreador: comunidad.idCreador,
        estado: comunidad.estado,
        fecha: '2025-09-24'
      }
    };
    this.peticion.put(act.host + act.path, act.payload, token).then((res: any) => {
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
        text: 'Error al actualizar la comunidad',
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    });
  }

}