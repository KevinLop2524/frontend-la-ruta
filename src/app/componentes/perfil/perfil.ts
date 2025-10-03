import { Header } from '../header/header';
import { Peticion } from '../../servicios/peticion';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [Header, FormsModule, RouterModule, CommonModule ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil {

  tema: 'light' | 'dark'= 'light'
  datosNoPermitidos: (string | null | undefined)[] = ["", null, undefined]

  comunidadseleccionada: any= null
  comunidades: any[] = []
  usuario: any = {}
  apodo: String| null= null

  ngOnInit(): void {
    const temaGuardado= localStorage.getItem('tema');
    this.apodo=localStorage.getItem('apodo')
    this.buscarUsuario();

  }

  comunidadEditar: any = {
    tematica: '',
    nombre: '',
    descripcion: '',
    tipo: '',
    id_creador: this.usuario.id,
  };

  constructor(private peticion: Peticion, private cdr: ChangeDetectorRef, private route: ActivatedRoute) { }
  abrirModal(comunidad: any) {
    this.comunidadseleccionada= comunidad;
    this.comunidadEditar = { ...comunidad };
  }

  buscarUsuario() {
    let apodo = localStorage.getItem('apodo') || undefined;
    let get = {
      host: this.peticion.urlReal,
      path: "/usuario/apodo/" + apodo,
      payload: {
      }
    }
    this.peticion.get(get.host + get.path).then((res: any) => {
      this.usuario = res.usuario;
      this.cargarComunidades()
      this.cdr.detectChanges()
    }).catch(() => {
      console.log("Usuario logueado:", this.usuario.usuario);
      console.log("Error al encontrar usuario")
    })
  }

  cargarComunidades() {
    let get = {
      host: this.peticion.urlReal,
      path: "/comunidad/creador/" + this.usuario.id,
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
      }if (this.datosNoPermitidos.includes(this.comunidadEditar.nombre)){
        Swal.fire({
          title: 'Error',
          text: 'No puedes dejar el campo nombre vacio',
          icon: 'warning'
        });
        return;
      }if (this.datosNoPermitidos.includes(this.comunidadEditar.descripcion)){
        Swal.fire({
          title: 'Error',
          text: 'No puedes dejar el campo descripción vacio',
          icon: 'warning'
        });
        return;
      }if (this.datosNoPermitidos.includes(this.comunidadEditar.tipo)){
        Swal.fire({
          title: 'Error',
          text: 'No puedes dejar el campo tipo vacio',
          icon: 'warning'
        });
        return;
      }if (this.datosNoPermitidos.includes(this.comunidadEditar.tematica)){
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
          idCreador: this.usuario.id
        }
      };
      this.peticion.put(act.host + act.path, act.payload, token).then((res: any) => {
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


