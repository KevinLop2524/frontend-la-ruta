import { Header } from '../header/header';
import { Peticion } from '../../servicios/peticion';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Footer } from "../footer/footer";
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { comunidadZodValidator } from '../../validators/comunidad-zod.validator';





@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [Header, FormsModule, RouterModule, CommonModule, Footer, HttpClientModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
  providers: [comunidadZodValidator]
})
export class Perfil {

  constructor(private peticion: Peticion, private cdr: ChangeDetectorRef, private route: ActivatedRoute, private http: HttpClient, private validar: comunidadZodValidator) { }

  datosNoPermitidos: (string | null | undefined)[] = ["", null, undefined, "Seleccionar", " "]

  comunidadseleccionada: any = { nombre: " " }
  comunidades: any[] = []
  usuario: any = {}
  apodo: String | null = null
  fraseMotivacional: String = '';
  autorFrase: String = '';
  fraseMoti: any= {}

  ngOnInit(): void {
    this.comunidadseleccionada.nombre = " "

    this.apodo = localStorage.getItem('apodo')
    this.buscarUsuario();
    this.obtenerFraseMotivacional();

  }

  comunidadEditar: any = {
    category: '',
    name: '',
    description: '',
  };

  abrirModal(comunidad: any) {
    this.comunidadseleccionada = comunidad;
    this.comunidadEditar = { ...comunidad };
  }




  obtenerFraseMotivacional(): void {
    let get = {
      host: this.peticion.urlReal,
      path: "/api/frase"}
      
    let token = localStorage.getItem('token') || undefined;

    this.peticion.get(get.host + get.path, token).then((res: any) => {
      this.fraseMoti = res[0];
      console.log('frase motivacional', this.fraseMoti)
      this.cdr.detectChanges();
    }).catch((err)=>{
      console.log('error al obtener frase motivacional', err)
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
    this.peticion.get(get.host + get.path).then((res: any) => {
      this.usuario = res;
      console.log("usuario obj", this.usuario)
      console.log("Usuario logueado:", this.usuario.apodo);
      this.cargarComunidades()
      this.cdr.detectChanges();
    }).catch((err) => {
      console.log(err)
      console.log("Error al encontrar usuario")
    })
  }

  cargarComunidades() {
    let get = {
      host: this.peticion.urlReal,
      path: "/api/communities/creator/"+ this.usuario.id +"/active" ,
      payload: {
      }
    }
    this.peticion.get(get.host + get.path).then((res: any) => {
      this.comunidades = res
      this.cdr.detectChanges()
    }).catch((err: any) => {
      console.error("error al obtener las comunidades", err);})
  }

  traductiCategoria(categoria: string) {
    switch (categoria) {
      case 'NUTRITION': return 'NUTRICION';
      case 'FITNESS': return 'FITNESS';
      case 'PERSONAL_DEVELOPMENT': return 'DESARROLLO PERSONAL';
      default: return categoria;
    }
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
        name: this.comunidadEditar.name,
        description: this.comunidadEditar.description,
        category: this.comunidadEditar.category
      }
    };
    this.peticion.patch(act.host + act.path, act.payload).then((res: any) => {
      Swal.fire({
        title: 'Actualizada',
        text: 'La comunidad fue actualizada',
        icon: 'success',
        confirmButtonText: 'Correcto'
      })
      this.cargarComunidades();
    }).catch((err: any) => {
      console.error("error al actualizar la comunidad", err);
      console.log(this.comunidadEditar)
      Swal.fire({
        title: 'Error',
        text: 'Error al actualizar la comunidad'+ err,
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    });
  }
}