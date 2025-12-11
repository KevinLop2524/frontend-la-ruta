import { Header } from '../header/header';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Peticion } from '../../servicios/peticion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Footer } from '../footer/footer';
import { RouterModule } from '@angular/router';
import { z } from "zod";//Se importa la dependencia zod


//aqui se crea el esquema que queremos para nuestra publicación
    const publicacionSchema = z.object({
    contenido: z.string().min(1, "Contenido requerido").regex(/[a-zA-Z]/, "El contenido es invalido"),
    nombre: z.string().min(1, "Nombre requerido").regex(/[a-zA-Z]/, "El nombre es invalido"),
    descripcion: z.string().min(1, "descripción requerida").regex(/[a-zA-Z]/, "La descripción es invalida"),
    categoria: z.string().min(1, "categoria requerida").regex(/[a-zA-Z]/, "La categoria es invalida"),
    estado: z.string().default("activo"),
    usuario_id: z.number()
  })

@Component({
  selector: 'app-publicacion',
  imports: [Header, CommonModule, FormsModule, Footer, RouterModule],
  templateUrl: './blog-principal.html',
  styleUrls: ['./blog-principal.css']  
})


export class BlogPrincipal implements OnInit {

  usuario: any = {};
  datosNoPermitidos: (string | null | undefined)[] = ["", null, undefined];
  publicaciones: any[] = [];

  // 🚀 Usuario mínimo necesario para backend
  nuevaPublicacion: any = {
    contenido: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    estado: 'activo',
    fecha: new Date().toISOString().split('T')[0],
    usuario_id: this.usuario.id 
  };

  publicacionEditar: any = { ...this.nuevaPublicacion };

  constructor(private peticion: Peticion, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.buscarUsuario();    // 🔹 Primero buscamos el usuario
    this.cargarPublicaciones(); // 🔹 Luego cargamos publicaciones
  }

  buscarUsuario() {
    const apodo = localStorage.getItem('apodo') || undefined;
    const url = this.peticion.urlReal + "/usuarios/apodo/" + apodo;

    this.peticion.get(url).then((res: any) => {
      this.usuario = res;
      console.log(res)
      // ⚡ Asignamos usuario_id después de recibir el usuario
      this.nuevaPublicacion.usuario_id = this.usuario.id;
      this.cdr.detectChanges();
    }).catch(() => {
      console.log("Error al encontrar usuario");
    });
  }

  cargarPublicaciones() {
    const url = this.peticion.urlReal + "/api/publicaciones"; // GET correcto
    this.peticion.get(url).then((res: any) => {
      this.publicaciones = res;
      this.cdr.detectChanges();
    }).catch(() => {
      console.log("Error al obtener publicaciones");
    });
  }

  crearPublicacion() {

    /*aqui se hace una comprobación sobre el objeto nueva publicación con el esquema que creamos anteriormente
    para asignarle a la variable resultado
    */

    const resultado= publicacionSchema.safeParse(this.nuevaPublicacion)


    //Aqui estamos verificando que si la validación fallo entonces muestre en una alerta el resultado con el mensaje de error
    if (!resultado.success){
      const error= resultado.error.errors[0];
      Swal.fire({
        title: 'Error de validación',
        text: error.message,
        icon: 'warning'
      });
      return;
    }

    // ⚠ Revisamos que el usuario esté cargado
    if (!this.nuevaPublicacion.usuario_id) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo obtener el usuario logueado',
        icon: 'error'
      });
      return;
    }

    const token = localStorage.getItem('token') || undefined;
    const url = this.peticion.urlReal + "/api/publicaciones";

    this.peticion.post(url, this.nuevaPublicacion, token).then((res: any) => {
      Swal.fire({
        title: '¡Éxito!',
        text: 'Publicación creada correctamente',
        icon: 'success',
        confirmButtonText: 'Ok'
      });

      this.cargarPublicaciones();
      this.cdr.detectChanges();

      // 🔄 Reiniciar el formulario sin perder el usuario_id
      this.nuevaPublicacion = {
        contenido: '',
        nombre: '',
        descripcion: '',
        categoria: '',
        estado: 'activo',
        fecha: new Date().toISOString().split('T')[0],
        usuario_id: this.usuario.id
      };

    }).catch((err: any) => {
      console.error("Error al crear la publicación", err);
      Swal.fire({
        title: 'Error',
        text: err.error?.mensaje || 'Error al crear la publicación',
        icon: 'error'
      });
    });
  }

  eliminarPublicacion(idSeleccionado: number) {
    const url = this.peticion.urlReal + "/api/publicaciones/" + idSeleccionado;
    this.peticion.delete(url, {}).then(() => {
      Swal.fire({
        title: 'Eliminada',
        text: 'La publicación fue eliminada',
        icon: 'success',
        confirmButtonText: 'Correcto'
      });
      this.cargarPublicaciones();
      this.cdr.detectChanges();
    }).catch((err: any) => {
      console.error("error al eliminar la publicación", err);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar la publicación',
        icon: 'error'
      });
    });
  }

  abrirEditar(publicacion: any) {
    this.publicacionEditar = { ...publicacion }; // clonar para no editar en vivo
    this.cdr.detectChanges(); // refrescar vista
  }

  actualizarPublicacion(publicacion: any) {

    const resultado= publicacionSchema.safeParse(this.publicacionEditar)

    if (!resultado.success){
      const error= resultado.error.errors[0];
      Swal.fire({
        title: 'Error de validación',
        text: error.message,
        icon: 'warning'
      });
      return;
    }
    const token = localStorage.getItem('token') || undefined;
    const url = this.peticion.urlReal + '/api/publicaciones/' + publicacion.id;

    this.peticion.put(url, this.publicacionEditar, token).then(() => {
      Swal.fire({
        title: 'Actualizada',
        text: 'La publicación fue actualizada',
        icon: 'success',
        confirmButtonText: 'Correcto'
      });
      this.cargarPublicaciones();
    }).catch((err: any) => {
      console.error("error al actualizar la publicación", err);
      Swal.fire({
        title: 'Error',
        text: 'Error al actualizar la publicación',
        icon: 'error'
      });
    });
  }
}