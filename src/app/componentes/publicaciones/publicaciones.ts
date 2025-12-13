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


  contenido: string = '';
  idComunidad: number = 0;
  usuario: any = {}
  publicaciones: any = []
  comunidad: any = {}
  imagenSeleccionada: any;
  publicacionSeleccionada: any = null
  modalAbierto: boolean = false;
  comentarios: any[] = [];
  nuevoComentario: string = "";
  contenidoEditado: string = "";
  imagenSeleccionadaEditar: any = null;



  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.idComunidad = +params['id'];
      console.log('ID de la comunidad', this.idComunidad);
      this.buscarUsuario();
      this.cargarPublicaciones();
      this.buscarComunidad();
    })
  }

  menuAbierto: number | null = null;

toggleMenu(idPost: number) {
  this.menuAbierto = this.menuAbierto === idPost ? null : idPost;
}

editarPost(idPost: number) {
  console.log("Editar post:", idPost);
  this.menuAbierto = null;

}

abrirModalEditar(publicacion: any) {
  this.publicacionSeleccionada = publicacion;

  // Precargar contenido
  this.contenidoEditado = publicacion.contenido;

  // Resetear imagen
  this.imagenSeleccionadaEditar = null;
}

abrirComentarios(publicacion: any) {
  this.publicacionSeleccionada = publicacion;

  this.cargarComentarios()

  const modal = new (window as any).bootstrap.Modal(
    document.getElementById('modalComentarios')
  );
  modal.show();
}



abrirModalEliminar(publicacion: any) {
  this.publicacionSeleccionada = publicacion;
  console.log("Publicación seleccionada:", this.publicacionSeleccionada);
}


  onFileSelected(event: any) {
  this.imagenSeleccionada = event.target.files[0];
}


  abrirModal() {
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
  }
  buscarComunidad() {
    let token = localStorage.getItem('token') || undefined;

    let get = {
      host: this.peticion.urlReal,
      path: "/api/communities/get/" + this.idComunidad
    }

    this.peticion.get(get.host + get.path, token).then((res: any) => {
      this.comunidad = res;
      this.cdr.detectChanges();
    })
  }
  buscarUsuario() {

    let apodo = localStorage.getItem('apodo') || undefined;
    let token = localStorage.getItem('token') || undefined;
    let get = {
      host: this.peticion.urlReal,
      path: "/api/users/me",
      payload: {
      }
    }
    this.peticion.get(get.host + get.path, token).then((res: any) => {
      this.usuario = res;
      this.cdr.detectChanges()
      console.log("Usuario logueado:", this.usuario.id);

    }).catch((err: any) => {
      console.log("Error al encontrar usuario", apodo, "Error: ", err);
    })
  }

  cargarPublicaciones() {
    let get = {
      host: this.peticion.urlReal,
      path: "/api/posts/community/" + this.idComunidad,
    }

    this.peticion.get(get.host + get.path).then((res: any) => {
      console.log(res)
      this.publicaciones = res
      this.cdr.detectChanges()
    }).catch((err: any) => {
      console.log("Error al encontrar publicaciones: ", err);
    })
  }

  crearPublicacion() {

    let token = localStorage.getItem('token') || undefined;


    const formData = new FormData();

    if (this.imagenSeleccionada) {
      formData.append('media', this.imagenSeleccionada)
    }

    const data = {
      "contenido": this.contenido,
      "type": "COMMUNITY",
      "comunidadId": this.idComunidad
    }

    formData.append('data', JSON.stringify(data));


    this.peticion.postFormData(
      this.peticion.urlReal + '/api/posts/communities/' + this.idComunidad,
      formData,
      token
    ).then((res: any) => {

      Swal.fire({
        title: '¡Exito!',
        text: 'Publicación creada con exito',
        icon: 'success',
        confirmButtonText: 'Ok'
      });
      this.contenido = '';
      this.imagenSeleccionada = null;
      this.cerrarModal();
      this.cargarPublicaciones();
    }).catch((err: any) => {
      console.log(err);
      Swal.fire({
        title: 'Error',
        text: 'Error al crear la publicación',
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    });
  }

  like(idPost: number) {
    let token = localStorage.getItem('token') || undefined;

    this.peticion.post(
      this.peticion.urlReal + '/api/posts/' + idPost + '/like',
      {},
      token
    ).then((res: any) => {
      console.log("Like exitoso", res);
      this.cargarPublicaciones();
    }).catch((err: any) => {
      console.log("Error en like", err);
      //    @DeleteMapping("/{id}/like")

      let del={
        host: this.peticion.urlReal,
        patch: '/api/posts/'+idPost+'/like'
      }
      if(err.error.message== "Ya has dado like a esta publicación"){

        this.peticion.delete(del.host+ del.patch, 
          {}).then((res:any)=>{
          console.log("Se quito el like de la publicación")
          this.nuevoComentario = "";
          this.cargarPublicaciones();
          this.cdr.detectChanges();

        }).catch((err: any)=>{
          console.log("No se pudo quitar el like")
        })
      }else{
        Swal.fire({
          title: 'Error',
          text: 'No se puede dar like: '+ err.error.message,
          icon: 'error',
          confirmButtonText: 'Ok'
        });
    }})
  }

  actualizarPublicacion(){
    let act={
      host: this.peticion.urlReal,
      patch: '/api/posts/'+ this.publicacionSeleccionada.id,
      payload: {
        contenido: this.contenidoEditado
      }
    }

    this.peticion.put(act.host+act.patch, act.payload).then((res: any)=>{
      Swal.fire({
        title: 'Correcto',
        text: 'Se actualizo tu publicación',
        icon: 'success',
        confirmButtonText: 'Ok'
      })
      this.cargarPublicaciones()
    }).catch((err: any)=>{
      Swal.fire({
        title: 'Error',
        text: 'no se pudo actualizar tu publicación' + err,
        icon: 'error',
        confirmButtonText: 'Cerrar'
      })
    })
  }

  eliminarPublicacion(){
    const id= this.publicacionSeleccionada.id;

    let del={
      path: '/api/posts/'+ id,
      host: this.peticion.urlReal
    };

    this.peticion.delete(del.host+ del.path, {}).then((res: any)=>{
      console.log("respuesta: ", res)
      Swal.fire({
        title: 'Eliminada',
        text: 'La publicación fue eliminada',
        icon: 'success',
        confirmButtonText: 'OK'
      })
      this.cargarPublicaciones()
    }).catch((err: any)=>{
        console.log("respuesta error: ", err)

        Swal.fire({
          title: 'Error',
          text: 'Error al eliminar la comunidad'+ err,
          icon: 'error',
          confirmButtonText: 'Cerrar'
        })
      })
    
  }
//metodo para crear comentario en una publicación
  crearComentario(){


    let pos={
      host: this.peticion.urlReal,
      patch: '/api/posts/'+this.publicacionSeleccionada.id+'/comments',
      payload: {
        contenido: this.nuevoComentario
      }
    }

    this.peticion.post(pos.host+pos.patch, pos.payload).then((res: any)=>{
      Swal.fire({
        title: 'Creado',
        text: 'Se pudo crear el comentario',
        icon: 'success',
        confirmButtonText: 'Ok'
      });
      this.cargarComentarios();
    }).catch((err: any)=>{
      console.log("error al crear comentario", err)
      Swal.fire({
        title: 'Error',
        text: 'No se pudo crear el comentario',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    })
  }

  cargarComentarios(){

//    @GetMapping("/{id}/comments")


    let get= {
      host: this.peticion.urlReal,
      patch: '/api/posts/'+this.publicacionSeleccionada.id+ '/comments'
    }

    this.peticion.get(get.host+ get.patch).then((res: any)=>{
      this.comentarios= res;
      this.cdr.detectChanges();
      console.log("Se cargaron las publicaciones correctamentes"+ this.comentarios);
    }).catch((err: any)=>{
      console.log("No se puedieron cargar las publicaciones correcatamente"+ err);
    })
  }
}




