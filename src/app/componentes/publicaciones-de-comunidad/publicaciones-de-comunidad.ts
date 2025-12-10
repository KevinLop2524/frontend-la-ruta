import { Header } from '../header/header';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Peticion } from '../../servicios/peticion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router, RouterLink } from '@angular/router';
import { Footer } from '../footer/footer';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-publicaciones-de-comunidad',
  imports: [Header, CommonModule, FormsModule, Footer, RouterModule],
  templateUrl: './publicaciones-de-comunidad.html',
  styleUrl: './publicaciones-de-comunidad.css'
})
export class PublicacionesDeComunidad {

  constructor(private peticion: Peticion, private cdr: ChangeDetectorRef, private router: Router, private route: ActivatedRoute) { }

  nuevaPublicacion: any = {
    contenido: '',
    type: 'COMMUNITY'
  };
  idComunidad: number = 0;
  usuario: any = {}
  publicaciones: any= []
  comunidad: any= {}

  modalAbierto: boolean = false;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.idComunidad = +params['id'];
      console.log('ID de la comunidad', this.idComunidad);
      this.buscarUsuario();
      this.cargarPublicaciones();
      this.buscarComunidad();
    })
  }

  abrirModal() {
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
  }
  buscarComunidad(){
    let token = localStorage.getItem('token') || undefined;

    let get={
      host: this.peticion.urlReal,
      path: "/api/communities/get/" + this.idComunidad
    }

    this.peticion.get(get.host+ get.path, token).then((res:any)=>{
      this.comunidad= res;
      this.cdr.detectChanges();
    })
  }
  buscarUsuario() {

    let apodo = localStorage.getItem('apodo') || undefined;
    let token = localStorage.getItem('token') || undefined;
    let get = {
      host: this.peticion.urlReal,
      path: "/api/users/get/" + 1,
      payload: {
      }
    }
    this.peticion.get(get.host + get.path, token).then((res: any) => {
      this.usuario = res;
      this.cdr.detectChanges()
      console.log("Usuario logueado:", this.usuario.id);
      this.nuevaPublicacion.author_id = this.usuario.id;

    }).catch((err: any) => {
      console.log("Error al encontrar usuario", apodo, "Error: ", err);
    })
  }

  cargarPublicaciones(){
    let get= {
      host: this.peticion.urlReal,
      path: "/api/posts/community/" + this.idComunidad,
    }

    this.peticion.get(get.host+ get.path).then((res: any)=>{
      console.log(res)
      this.publicaciones= res
      this.cdr.detectChanges()
    }).catch((err: any)=>{
      console.log("Error al encontrar publicaciones: ", err);
    })
  }

  crearPublicacion() {

    let token = localStorage.getItem('token') || undefined;

    let post = {
      host: this.peticion.urlReal,
      path: "/api/posts/communities/" + this.idComunidad,
      payload: this.nuevaPublicacion
    }
    this.peticion.post(post.host + post.path, post.payload, token).then((res: any) => {
      if (res) {
        Swal.fire({
          title: '¡Exito!',
          text: res.mensaje,
          icon: 'success',
          confirmButtonText: 'Ok'
        })
      }
    }).catch((err: any) => {
      console.log(err.error.message)
      Swal.fire({
        title: 'Error',
        text: 'Error al crear la publicación' + err,
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    });
  }
  
  like()
  {
    let token = localStorage.getItem('token') || undefined;

    let post = {
      host: this.peticion.urlReal,
      path: "/api/posts/like/" + this.idComunidad,
      payload: this.nuevaPublicacion
    }
  }

}





