import { Header } from '../header/header';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Peticion } from '../../servicios/peticion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Footer } from '../footer/footer';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-comunidad',
  imports: [Header, CommonModule, FormsModule, Footer, RouterModule],
  templateUrl: './comunidad.component.html',
  styleUrl: './comunidad.component.css'
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
    idCreador: null
  };

  abrirModal(comunidad: any) {
    this.comunidadseleccionada = comunidad;
    this.comunidadEditar = { ...comunidad };
  }

  constructor(private peticion: Peticion, private cdr: ChangeDetectorRef) { }

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


    const newNombre = this.datosNoPermitidos.findIndex((dato) => dato === this.nuevaComunidad.nombre);
    const newDescripcion = this.datosNoPermitidos.findIndex((dato) => dato === this.nuevaComunidad.descripcion);
    const newTipo = this.datosNoPermitidos.findIndex((dato) => dato === this.nuevaComunidad.tipo);
    const newTematica = this.datosNoPermitidos.findIndex((dato) => dato === this.nuevaComunidad.tematica);
    let token = localStorage.getItem('token') || undefined;

    if (newNombre !== -1) {
      console.log(this.nuevaComunidad.nombre)
      Swal.fire({
        title: 'Error',
        text: 'Nombre de comunidad no valida',
        icon: 'warning'
      });
      return;
    } else if (newDescripcion !== -1) {
      Swal.fire({
        title: 'Error',
        text: 'Descripción no valida',
        icon: 'warning'
      });
      return;
    } else if (newTipo !== -1) {
      Swal.fire({
        title: 'Error',
        text: 'Campo tipo no valido',
        icon: 'warning'
      });
      return;
    }
    else if (newTematica !== -1) {
      Swal.fire({
        title: 'Error',
        text: 'Campo tematica no valida',
        icon: 'warning'
      });
      return;
    }

    if (!this.usuario || !this.usuario.id) {
      Swal.fire({
        title: 'Error',
        text: 'No se ha cargado el usuario aún. Intente de nuevo.',
        icon: 'warning'
      });
      return;
    }

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

    const newNombreE = this.datosNoPermitidos.findIndex((dato) => dato === this.comunidadEditar.nombre);
    const newDescripcionE = this.datosNoPermitidos.findIndex((dato) => dato === this.comunidadEditar.descripcion);
    const newtipoE = this.datosNoPermitidos.findIndex((dato) => dato === this.comunidadEditar.tipo);
    const newTematicaE = this.datosNoPermitidos.findIndex((dato) => dato === this.comunidadEditar.tematica);

    if (this.datosNoPermitidos.includes(this.comunidadEditar.nombre) &&
      this.datosNoPermitidos.includes(this.comunidadEditar.descripcion) &&
      this.datosNoPermitidos.includes(this.comunidadEditar.tipo) &&
      this.datosNoPermitidos.includes(this.comunidadEditar.tematica)) {
      Swal.fire({
        title: 'Error',
        text: 'Tiene que ingresar al menos un campo para actualizar',
        icon: 'warning'
      });
      return;
    } if (this.datosNoPermitidos.includes(this.comunidadEditar.nombre)) {
      Swal.fire({
        title: 'Error',
        text: 'No puedes dejar el campo nombre vacio',
        icon: 'warning'
      });
      return;
    } if (this.datosNoPermitidos.includes(this.comunidadEditar.descripcion)) {
      Swal.fire({
        title: 'Error',
        text: 'No puedes dejar el campo descripción vacio',
        icon: 'warning'
      });
      return;
    } if (this.datosNoPermitidos.includes(this.comunidadEditar.tipo)) {
      Swal.fire({
        title: 'Error',
        text: 'No puedes dejar el campo tipo vacio',
        icon: 'warning'
      });
      return;
    } if (this.datosNoPermitidos.includes(this.comunidadEditar.tematica)) {
      Swal.fire({
        title: 'Error',
        text: 'No puedes dejar el campo tematica vacio',
        icon: 'warning'
      });
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
        idCreador: comunidad.idCreador
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