import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { Peticion } from '../../servicios/peticion';
import { ChangeDetectorRef, Component, Host, OnInit } from '@angular/core';
import { Footer } from '../footer/footer';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-servicio',
  imports: [CommonModule, Header, Footer, FormsModule],
  templateUrl: './servicio.component.html',
  styleUrl: './servicio.component.css'
})
export class ServicioComponent implements OnInit {

      datosNoPermitidos: (string | null | undefined)[] = ["", null, undefined];

    servicios: any[] = []
    idComunidad: number =0
    usuario: any= {}
    comunidad: any = {}

    ServicioCrear: any ={
      titulo: '',
      descripcion: '',
      categoria: '',
      estado: 'activo',
      fecha: '2025-09-24',
      id_creador: '',
      comunidad_id: ''
    }


constructor(private peticion: Peticion, private cdr: ChangeDetectorRef, private route: ActivatedRoute) { }


ngOnInit(): void {
  const id = this.route.snapshot.paramMap.get('id');
  if (id) {
    this.idComunidad = +id;
    this.cargarServicios();
    this.buscarUsuario();
    this.BuscarComunidad();
  }
}
 buscarUsuario(){

    let apodo = localStorage.getItem('apodo') || undefined;
    let get= {
      host: this.peticion.urlReal,
      path: "/usuario/apodo/"+ apodo,
      payload: {
      }
    }
    this.peticion.get(get.host + get.path).then((res:any)=>{
      this.usuario= res.usuario;
      this.ServicioCrear.id_creador= this.usuario.id
      this.cdr.detectChanges()
    }).catch(()=> {
      console.log("Usuario logueado:", this.usuario.usuario);
      console.log("Error al encontrar usuario")
    })
  }

  BuscarComunidad(){
    let get={
      host: this.peticion.urlReal,
      path: "/comunidad/"+ this.idComunidad,
      payload:{}
    }

    let token = localStorage.getItem('token') || undefined;
    this.peticion.get(get.host + get.path, token).then((res: any) => {
       this.cdr.detectChanges()
      this.comunidad = res
      console.log("comunidad cargada: ", this.comunidad)
      this.cdr.detectChanges()
    }).catch((err)=>{
      console.error("error al obtener la comunidad", err)
    })
  }


  cargarServicios() {
    let get = {
      host: this.peticion.urlReal,
      path: "/api/servicio/comunidad/" + this.idComunidad,
      payload: {}
    }
    this.peticion.get(get.host + get.path).then((res: any) => {
      this.cdr.detectChanges()
      this.servicios = res
      console.log("Servicios cargados:", this.servicios);
      this.cdr.detectChanges()
    }).catch((err) => {
      console.error("Error al obtener servicios", err)
    })
  }

  crearServicio() {
    
    if (this.datosNoPermitidos.includes(this.ServicioCrear.titulo)) {
  Swal.fire({
    title: 'Error',
    text: 'El campo nombre esta vacio',
    icon: 'warning'
  })
  return;
}else if (this.datosNoPermitidos.includes(this.ServicioCrear.descripcion)) {
  Swal.fire({
    title: 'Error',
    text: 'El campo descripción esta vacio',
    icon: 'warning'
  })
  return;
}else if (this.datosNoPermitidos.includes(this.ServicioCrear.categoria)) {
  Swal.fire({
    title: 'Error',
    text: 'El campo categoria esta vacio',
    icon: 'warning'
  })
  return;
}


    let token = localStorage.getItem('token') || undefined;

    let post = {
      host: this.peticion.urlReal,
      path: "/api/servicio/crear",
      payload:{
        nombre: this.ServicioCrear.titulo,
        descripcion: this.ServicioCrear.descripcion,
        estado: 'activo',
        categoria: this.ServicioCrear.categoria,
        idCreador: this.usuario.id,
        comunidad: {id: this.idComunidad}
      }
    }

      this.peticion.post ( post.host + post.path, post.payload, token).then((res:any) =>{
        
        console.log("se creo el servicio", res)
        if(res.estado){
        Swal.fire({
          title: '¡Exito!',
          text: res.mensaje,
          icon: 'success',
          confirmButtonText: 'Ok'
        })
        this.cargarServicios();
        this.ServicioCrear= {titulo: '', descripcion: '', categoria: '', id_creador: this.usuario.id, comunidad_id: this.idComunidad, estado: '', fecha: '2025-09-24'}
      } 
      }
    ).catch((err:any)=>{
      console.error("error al crear servicio", err),
      Swal.fire({
        title: 'Error',
        text: err.error?.mensaje || 'Error al crear el servicio, terrible',
        icon: 'error',
        confirmButtonText: 'Cerrar'
      })
    })
    }
  }
